import { Request } from 'express';

const takeFirstForwardedValue = (value: string): string => value.split(',')[0].trim();

export const getRequestProtocol = (req: Request): string => {
  const forwardedProto = req.get('x-forwarded-proto');
  if (forwardedProto) {
    return takeFirstForwardedValue(forwardedProto);
  }

  return req.protocol;
};

export const getRequestHost = (req: Request): string => {
  const forwardedHost = req.get('x-forwarded-host');
  if (forwardedHost) {
    return takeFirstForwardedValue(forwardedHost);
  }

  return req.get('host') || '';
};

export const getRequestBaseUrl = (req: Request): string => {
  return `${getRequestProtocol(req)}://${getRequestHost(req)}`;
};
