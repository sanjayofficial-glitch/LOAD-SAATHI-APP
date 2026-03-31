"use client";

import logger from "@/utils/logger";

export const handleError = (error: Error, context?: Record<string, any>) => {
  logger.error(`[ErrorHandler] ${error.message}`, { ...context, stack: error.stack });
  // Additional centralized handling could go here
};

export default handleError;