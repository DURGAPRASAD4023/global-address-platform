export type Country = {
  country_code: string;
  country_name: string;
  support_level: string;
  default_locale: string;
};

export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};
