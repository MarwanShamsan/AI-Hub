import { FastifyInstance } from "fastify";
import { extractIdentity } from "../authz/identity";
import { RequestRepository } from "../repositories/request.repository";
import {
  RequestFileRepository,
  type RequestFileRecord
} from "../repositories/request-file.repository";

type Deps = {
  requestRepo: RequestRepository;
  requestFileRepo: RequestFileRepository;
};

export async function requestFilesRoute(app: FastifyInstance, opts: Deps) {
  app.get("/:requestId/files", async (request, reply) => {
    try {
      const identity = await extractIdentity(request);

      const { requestId } = request.params as { requestId: string };

      const requestRecord = await opts.requestRepo.getById(
        requestId,
        identity.tenant_id
      );

      if (!requestRecord) {
        return reply.status(404).send({
          status: "REJECTED",
          reason: "REQUEST_NOT_FOUND"
        });
      }

      const files = await opts.requestFileRepo.listByRequest(
        requestId,
        identity.tenant_id
      );

      return reply.status(200).send({
        status: "ACCEPTED",
        count: files.length,
        files
      });
    } catch (error: any) {
      return reply.status(401).send({
        status: "REJECTED",
        reason: error?.message || "UNAUTHORIZED"
      });
    }
  });

  app.post("/:requestId/files", async (request, reply) => {
    try {
      const identity = await extractIdentity(request);

      if (identity.actor_type !== "USER") {
        return reply.status(403).send({
          status: "REJECTED",
          reason: "REQUEST_FILE_UPLOAD_REQUIRES_USER"
        });
      }

      const { requestId } = request.params as { requestId: string };

      const requestRecord = await opts.requestRepo.getById(
        requestId,
        identity.tenant_id
      );

      if (!requestRecord) {
        return reply.status(404).send({
          status: "REJECTED",
          reason: "REQUEST_NOT_FOUND"
        });
      }

      const file = await request.file();

      if (!file) {
        return reply.status(400).send({
          status: "REJECTED",
          reason: "FILE_REQUIRED"
        });
      }

      const chunks: Buffer[] = [];

      for await (const chunk of file.file) {
        chunks.push(chunk as Buffer);
      }

      const fileBuffer = Buffer.concat(chunks);

      if (!file.filename) {
        return reply.status(400).send({
          status: "REJECTED",
          reason: "FILENAME_REQUIRED"
        });
      }

      const created = await opts.requestFileRepo.create({
        request_id: requestId,
        tenant_id: identity.tenant_id,
        uploaded_by: identity.actor_id,
        file_name: file.filename,
        content_type: file.mimetype || "application/octet-stream",
        file_size_bytes: fileBuffer.byteLength,
        file_data: fileBuffer
      });

      return reply.status(201).send({
        status: "ACCEPTED",
        file: created
      });
    } catch (error: any) {
      return reply.status(400).send({
        status: "REJECTED",
        reason: error?.message || "UPLOAD_FAILED"
      });
    }
  });
}

export type ListRequestFilesResponse = {
  status: "ACCEPTED";
  count: number;
  files: RequestFileRecord[];
};

export type UploadRequestFileResponse = {
  status: "ACCEPTED";
  file: RequestFileRecord;
};