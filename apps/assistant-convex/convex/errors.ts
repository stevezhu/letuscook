import { ConvexError } from 'convex/values';

/**
 * ✅ Reviewed by [@stevezhu](https://github.com/stevezhu)
 */
export class EntityNotFoundError extends ConvexError<{
  message: string;
  entityName?: string;
  argName: string;
  argValue: string;
}> {
  constructor({
    entityName,
    argName,
    argValue,
  }: {
    entityName?: string;
    argName: string;
    argValue: string;
  }) {
    super({
      message: `Not found`,
      entityName,
      argName,
      argValue,
    });
  }
}
