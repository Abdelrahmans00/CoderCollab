import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { Request, Response, NextFunction } from "express";

export const validateDto = (dtoClass: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dtoObject = plainToInstance(dtoClass, req.body);

    const errors = await validate(dtoObject, {
      whitelist: true, // removes unknown fields
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      return res.status(400).json({
        errors: errors.map((e) => ({
          field: e.property,
          message: Object.values(e.constraints || {}),
        })),
      });
    }

    req.body = dtoObject;
    next();
  };
};