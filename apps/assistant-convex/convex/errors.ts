import { ConvexError } from 'convex/values';

import { TableNames } from './_generated/dataModel.js';

/**
 * ✅ Reviewed by [@stevezhu](https://github.com/stevezhu)
 */
export class EntityNotFoundError extends ConvexError<{
  message: string;
  tableName: TableNames;
  argName: string;
  argValue: string;
}> {
  constructor({
    tableName,
    argName,
    argValue,
  }: {
    tableName: TableNames;
    argName: string;
    argValue: string;
  }) {
    super({
      message: `Not found`,
      tableName,
      argName,
      argValue,
    });
  }
}
