export type FieldError = { field: string; message: string };

export type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export type ApiErrorBody = {
  success: false;
  message: string;
  errors?: FieldError[];
  code?: string;
  /** @deprecated legacy backend shape */
  error?: string;
};
