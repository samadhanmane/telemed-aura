import { toast } from "sonner";
import { getApiErrorMessage } from "./client";

export function showApiError(err: unknown, fallback = "Something went wrong") {
  toast.error(getApiErrorMessage(err, fallback));
}

export function showApiSuccess(message: string, description?: string) {
  if (description) {
    toast.success(message, { description });
  } else {
    toast.success(message);
  }
}
