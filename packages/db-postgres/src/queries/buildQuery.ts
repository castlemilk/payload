import { Where } from 'payload/dist/types';
import { Field } from 'payload/dist/fields/config/types';
import { PgSelectQueryBuilder, PgTable } from 'drizzle-orm/pg-core';
import { asc, desc, SQL } from 'drizzle-orm';
import { parseParams } from './parseParams';
import { PostgresAdapter } from '../types';
import { traversePath } from './traversePath';

export type BuildQueryJoins = Record<string, {
  table: PgTable<any>,
  condition: SQL,
}>

type BuildQueryArgs = {
  selectQuery: PgSelectQueryBuilder<any, any, any, any, any>
  joins: BuildQueryJoins
  adapter: PostgresAdapter
  where: Where
  locale?: string
  collectionSlug?: string
  globalSlug?: string
  versionsFields?: Field[]
  sort: string
}
const buildQuery = async function buildQuery({
  selectQuery,
  joins,
  adapter,
  where,
  locale,
  collectionSlug,
  globalSlug,
  versionsFields,
  sort,
}: BuildQueryArgs): Promise<SQL> {
  let fields = versionsFields;
  if (!fields) {
    if (globalSlug) {
      const globalConfig = adapter.payload.globals.config.find(({ slug }) => slug === globalSlug);
      fields = globalConfig.fields;
    }
    if (collectionSlug) {
      const collectionConfig = adapter.payload.collections[collectionSlug].config;
      fields = collectionConfig.fields;
    }
  }

  if (collectionSlug && sort) {
    let sortName;
    let sortOperator;
    if (sort[0] === '-') {
      sortName = sort.substring(1);
      sortOperator = desc;
    } else {
      sortName = sort;
      sortOperator = asc;
    }

    const sortPath = traversePath({
      adapter,
      collectionSlug,
      path: sortName,
      joins,
    });
    console.log(sortPath);
    selectQuery.orderBy(sortOperator(adapter.tables[sortPath.tableName][sortPath.columnName]));
  }

  return parseParams({
    joins,
    collectionSlug,
    fields,
    globalSlug,
    adapter,
    locale,
    where,
  });
};
  // const results = db.selectDistinct({ id: posts.id })
  //       .from(posts)
  //       .innerJoin(posts_locales, eq(posts.id, posts_locales._parentID))
  //       .innerJoin(posts_relationships, eq(posts.id, posts_relationships.parent))
  //       .where(eq(posts_locales.title, postTitleEN))
  //       .orderBy(posts_locales.title)
  //       .all()

export default buildQuery;
