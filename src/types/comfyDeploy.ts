// Tipos para la API de ComfyDeploy

export interface ComfyDeployQueueRequest {
  deployment_id: string;
  inputs: {
    imageInput: string; // URL de la imagen
  };
}

export interface ComfyDeployQueueResponse {
  run_id: string;
  status: string;
}

export interface ComfyDeployOutput {
  id: string;
  output_id: string | null;
  run_id: string;
  data: {
    text?: string[];
    images?: Array<{
      url: string;
      type: string;
      filename: string;
      is_public: boolean;
      subfolder: string;
      upload_duration: number;
    }>;
  };
  node_meta: {
    node_id: string;
    node_class?: string;
  };
  created_at: string;
  updated_at: string;
  type: string | null;
  node_id: string | null;
}

export interface ComfyDeployStatusResponse {
  id: string;
  workflow_version_id: string;
  workflow_inputs: {
    imageInput: string;
  };
  workflow_id: string;
  machine_id: string;
  origin: string;
  status: "queued" | "running" | "success" | "failed";
  ended_at: string | null;
  created_at: string;
  updated_at: string;
  queued_at: string | null;
  started_at: string | null;
  gpu_event_id: string | null;
  gpu: string;
  machine_version: string | null;
  machine_type: string;
  modal_function_call_id: string;
  user_id: string;
  org_id: string | null;
  live_status: string | null;
  progress: number;
  is_realtime: boolean;
  webhook: string | null;
  webhook_status: string | null;
  webhook_intermediate_status: boolean;
  outputs: ComfyDeployOutput[];
  number: number;
  duration: number | null;
  cold_start_duration: number | null;
  cold_start_duration_total: number | null;
  run_duration: number | null;
  queue_position: number | null;
}

export interface ComfyDeployError {
  message: string;
  status: "failed";
  error_details?: string;
}
