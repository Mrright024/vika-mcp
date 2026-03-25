import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { CapabilityRegistry } from '../../src/capabilities.js';
import { loadConfig } from '../../src/config.js';
import { VikaClient } from '../../src/http/client.js';
import { Logger } from '../../src/logger.js';
import { ResolverService } from '../../src/resolvers.js';

type AnyRecord = Record<string, unknown>;

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseJsonEnv<T>(name: string, fallback: T): T {
  const value = process.env[name];
  if (!value) {
    return fallback;
  }
  return JSON.parse(value) as T;
}

function getFirstString(value: unknown, preferredKeys: string[]): string | undefined {
  if (!value) {
    return undefined;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = getFirstString(item, preferredKeys);
      if (found) {
        return found;
      }
    }
    return undefined;
  }

  if (typeof value === 'object') {
    for (const key of preferredKeys) {
      const direct = (value as Record<string, unknown>)[key];
      if (typeof direct === 'string') {
        return direct;
      }
    }

    for (const nested of Object.values(value as Record<string, unknown>)) {
      const found = getFirstString(nested, preferredKeys);
      if (found) {
        return found;
      }
    }
  }

  return undefined;
}

async function main(): Promise<void> {
  const config = loadConfig();
  const logger = new Logger(config.logLevel).child({ suite: 'smoke' });
  const capabilities = new CapabilityRegistry();
  const client = new VikaClient(config, logger.child({ component: 'client' }), capabilities);
  const resolvers = new ResolverService(client);

  const spaceId = requireEnv('VIKA_TEST_SPACE_ID', config.testSpaceId);
  const nodeId = requireEnv('VIKA_TEST_NODE_ID', config.testNodeId);
  const datasheetId = requireEnv('VIKA_TEST_DATASHEET_ID', config.testDatasheetId);
  const prefix = `mcp_smoke_${Date.now()}`;

  const cleanup: Array<() => Promise<void>> = [];

  logger.info('smoke_start', { spaceId, nodeId, datasheetId, prefix });

  try {
    const spaces = await client.request({
      method: 'GET',
      path: '/spaces',
      feature: 'spaces.list',
    });
    logger.info('spaces_list_ok', { count: Array.isArray(spaces.data) ? spaces.data.length : undefined });

    const resolved = await resolvers.resolveDatasheet({
      spaceId,
      nodeId,
    });
    if (resolved.datasheet_id !== datasheetId) {
      throw new Error(`Resolved datasheet ${resolved.datasheet_id} does not match VIKA_TEST_DATASHEET_ID ${datasheetId}`);
    }

    try {
      await client.request({
        method: 'GET',
        version: 'v2',
        path: `/spaces/${spaceId}/nodes`,
        query: {
          type: 0,
          query: resolved.name,
        },
        feature: 'nodes.search',
      });
    } catch (error) {
      logger.warn('nodes_search_skipped', { error });
    }

    await client.request({
      method: 'GET',
      path: `/datasheets/${datasheetId}/records`,
      query: {
        pageSize: 10,
        pageNum: 1,
      },
      feature: 'records.list',
    });

    const fieldList = await client.request<{ fields?: Array<Record<string, unknown>> }>({
      method: 'GET',
      path: `/datasheets/${datasheetId}/fields`,
      feature: 'fields.list',
    });

    const existingFields = fieldList.data.fields ?? [];
    const defaultAttachmentFieldId = getFirstString(
      existingFields.find((field) => field.type === 'Attachment'),
      ['id', 'fieldId'],
    );
    const defaultTitleFieldId = getFirstString(
      existingFields.find((field) => field.isPrimary === true || field.name === '标题'),
      ['id', 'fieldId'],
    );

    if (!defaultAttachmentFieldId) {
      throw new Error('Unable to locate the default attachment field.');
    }

    const textFieldPayload = parseJsonEnv<AnyRecord>('VIKA_SMOKE_TEXT_FIELD_JSON', {
      name: `${prefix}_text`,
      type: 'SingleText',
      property: {},
    });

    const createdTextField = await client.request({
      method: 'POST',
      path: `/spaces/${spaceId}/datasheets/${datasheetId}/fields`,
      body: textFieldPayload,
      feature: 'fields.create',
      idempotent: false,
    });
    const textFieldId = getFirstString(createdTextField.data, ['fieldId', 'id']);
    if (!textFieldId) {
      throw new Error('Unable to extract created text field ID.');
    }
    cleanup.unshift(async () => {
      await client.request({
        method: 'DELETE',
        path: `/spaces/${spaceId}/datasheets/${datasheetId}/fields/${textFieldId}`,
        feature: 'fields.delete',
        idempotent: false,
      });
    });

    try {
      await client.request({
        method: 'PATCH',
        path: `/spaces/${spaceId}/datasheets/${datasheetId}/fields/${textFieldId}`,
        body: {
          name: `${prefix}_text_updated`,
        },
        feature: 'fields.update',
        idempotent: false,
      });
    } catch (error) {
      logger.warn('fields_update_skipped', { error });
    }

    const viewList = await client.request({
      method: 'GET',
      path: `/datasheets/${datasheetId}/views`,
      feature: 'views.list',
    });
    logger.info('views_list_ok', {
      count: Array.isArray((viewList.data as AnyRecord).views) ? ((viewList.data as AnyRecord).views as unknown[]).length : undefined,
    });

    try {
      const viewPayload = parseJsonEnv<AnyRecord>('VIKA_SMOKE_VIEW_JSON', {
        name: `${prefix}_grid`,
        type: 'Grid',
      });
      await client.request({
        method: 'POST',
        path: `/spaces/${spaceId}/datasheets/${datasheetId}/views`,
        body: viewPayload,
        feature: 'views.create',
        idempotent: false,
      });
    } catch (error) {
      logger.warn('views_mutation_skipped', { error });
    }

    const createdRecord = await client.request({
      method: 'POST',
      path: `/datasheets/${datasheetId}/records`,
      query: {
        fieldKey: 'id',
      },
      body: {
        records: [
          {
            fields: {
              [textFieldId]: `${prefix}_record`,
              ...(defaultTitleFieldId ? { [defaultTitleFieldId]: `${prefix}_title` } : {}),
            },
          },
        ],
        fieldKey: 'id',
      },
      feature: 'records.create',
      idempotent: false,
    });

    const recordId = getFirstString(createdRecord.data, ['recordId', 'id']);
    if (!recordId) {
      throw new Error('Unable to extract created record ID.');
    }
    cleanup.unshift(async () => {
      await client.request({
        method: 'DELETE',
        path: `/datasheets/${datasheetId}/records`,
        query: {
          recordIds: [recordId],
        },
        feature: 'records.delete',
        idempotent: false,
      });
    });

    await client.request({
      method: 'PATCH',
      path: `/datasheets/${datasheetId}/records`,
      query: {
        fieldKey: 'id',
      },
      body: {
        records: [
          {
            recordId,
            fields: {
                [textFieldId]: `${prefix}_record_updated`,
                ...(defaultTitleFieldId ? { [defaultTitleFieldId]: `${prefix}_title_updated` } : {}),
              },
            },
          ],
        fieldKey: 'id',
      },
      feature: 'records.update',
      idempotent: false,
    });

    const tempDir = await mkdtemp(path.join(tmpdir(), 'vika-mcp-'));
    const tempFile = path.join(tempDir, `${prefix}.txt`);
    await writeFile(tempFile, `hello from ${prefix}\n`, 'utf8');

    try {
      const form = await client.createSingleFileFormData(tempFile, `${prefix}.txt`, 'text/plain');
      const uploadedAttachment = await client.request({
        method: 'POST',
        path: `/datasheets/${datasheetId}/attachments`,
        formData: form,
        feature: 'attachments.upload',
        idempotent: false,
        timeoutMs: 120_000,
      });

      const attachmentValue =
        (Array.isArray(uploadedAttachment.data) ? uploadedAttachment.data[0] : undefined) ??
        (uploadedAttachment.data as AnyRecord).data ??
        uploadedAttachment.data;

      await client.request({
        method: 'PATCH',
        path: `/datasheets/${datasheetId}/records`,
        query: {
          fieldKey: 'id',
        },
        body: {
          records: [
            {
              recordId,
              fields: {
                [defaultAttachmentFieldId]: [attachmentValue],
              },
            },
          ],
          fieldKey: 'id',
        },
        feature: 'records.update',
        idempotent: false,
      });
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }

    try {
      await client.request({
        method: 'GET',
        path: `/spaces/${spaceId}/roles`,
        feature: 'roles.list',
      });
    } catch (error) {
      logger.warn('roles_list_skipped', { error });
    }

    try {
      await client.request({
        method: 'GET',
        path: '/ai/ping',
        feature: 'ai',
      });
    } catch (error) {
      logger.warn('ai_request_expected', { error });
    }

    logger.info('smoke_success', {
      capabilities: capabilities.snapshot(),
    });
  } finally {
    for (const task of cleanup) {
      try {
        await task();
      } catch (cleanupError) {
        logger.warn('cleanup_failure', { cleanupError });
      }
    }
  }
}

main().catch(async (error) => {
  const logger = new Logger('error').child({ suite: 'smoke' });
  logger.error('smoke_failure', { error });
  process.exitCode = 1;
});
