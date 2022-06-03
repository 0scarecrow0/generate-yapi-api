import { JSONSchema4 } from 'json-schema';
import { PropDefinition } from '../types';
import { castArray, forOwn, isArray, isEmpty, isObject } from 'lodash';
import jsonSchemaGenerator from 'json-schema-generator';
import { compile } from 'json-schema-to-typescript';
import Mock from 'mockjs';
/**
 * 原地处理 JSONSchema。
 *
 * @param jsonSchema 待处理的 JSONSchema
 * @returns 处理后的 JSONSchema
 */
export function processJsonSchema<T extends JSONSchema4>(jsonSchema: T): T {
  if (!isObject(jsonSchema)) return jsonSchema;

  // 去除 title 和 id，防止 json-schema-to-typescript 提取它们作为接口名
  delete jsonSchema.title;
  delete jsonSchema.id;
  // 将 additionalProperties 设为 false
  jsonSchema.additionalProperties = false;

  // Mock.toJSONSchema 产生的 properties 为数组，然而 JSONSchema4 的 properties 为对象
  if (isArray(jsonSchema.properties)) {
    jsonSchema.properties = jsonSchema.properties.reduce<Exclude<JSONSchema4['properties'], undefined>>((props, js) => {
      props[js.name] = js;
      return props;
    },{});
  }

  // 继续处理对象的子元素
  if (jsonSchema.properties) {
    forOwn(jsonSchema.properties, processJsonSchema);
  }

  // 继续处理数组的子元素
  if (jsonSchema.items) {
    castArray(jsonSchema.items).forEach(processJsonSchema);
  }

  return jsonSchema;
}



/**
 * 将 JSONSchema 字符串转为 JSONSchema 对象。
 *
 * @param str 要转换的 JSONSchema 字符串
 * @returns 转换后的 JSONSchema 对象
 */
export function jsonSchemaStringToJsonSchema(str: string): JSONSchema4 {
  return processJsonSchema(
    JSON.parse(str),
  );
}

/**
 * 获得 JSON 数据的 JSONSchema 对象。
 *
 * @param json JSON 数据
 * @returns JSONSchema 对象
 */
export function jsonToJsonSchema(json: object): JSONSchema4 {
  return processJsonSchema(
    jsonSchemaGenerator(json),
  );
}



/**
 * 获得属性定义列表的 JSONSchema 对象。
 *
 * @param propDefinitions 属性定义列表
 * @returns JSONSchema 对象
 */
export function propDefinitionsToJsonSchema(propDefinitions: PropDefinition[]): JSONSchema4 {
  return processJsonSchema({
    type: 'object',
    required: propDefinitions.reduce<string[]>(
      (res, prop) => {
        if (prop.required) {
          res.push(prop.name);
        }
        return res;
      },
      [],
    ),
    properties: propDefinitions.reduce<Exclude<JSONSchema4['properties'], undefined>>(
      (res, prop: any) => {
        res[prop.name] = {
          type: prop.type,
          description: prop.comment
          // ...(prop.type === 'file' ? { tsType: FileData.name } : {})
        };
        return res;
      },
      {},
    )
  });
}
/**
 * 根据 JSONSchema 对象生产 TypeScript 类型定义。
 *
 * @param jsonSchema JSONSchema 对象
 * @param typeName 类型名称
 * @returns TypeScript 类型定义
 */
export async function jsonSchemaToType(jsonSchema: JSONSchema4, typeName: string): Promise<string> {
  if (isEmpty(jsonSchema)) {
    return `export interface ${typeName} {}`;
  }
  const codeTypeStr = await compile(jsonSchema, typeName, {
    bannerComment: '',
    /** 格式化代码 */
    format:false,
    /** 忽略类型的 maxItems 和 minItems array，防止生成元组。 */
    ignoreMinAndMaxItems:true,
    style: {
      bracketSpacing: false,
      printWidth: 120,
      semi: true,
      singleQuote: true,
      tabWidth: 2,
      trailingComma: 'none',
      useTabs: false
    }
  });
  return codeTypeStr.trim();
}

/**
 * 获得 mockjs 模板的 JSONSchema 对象。
 *
 * @param template mockjs 模板
 * @returns JSONSchema 对象
 */
export function mockjsTemplateToJsonSchema(template: object): JSONSchema4 {
  return processJsonSchema(
    Mock.toJSONSchema(template) as any,
  );
}
