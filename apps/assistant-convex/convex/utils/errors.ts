import { ConvexError } from 'convex/values';

import { TableNames } from '#convex/_generated/dataModel.js';

// 👀 Needs Verification
export class EntityNotFoundError extends ConvexError<{
  code: 'ENTITY_NOT_FOUND';
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
      code: 'ENTITY_NOT_FOUND',
      message: `Not found`,
      tableName,
      argName,
      argValue,
    });
  }
}
