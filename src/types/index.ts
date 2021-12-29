import { JSONSchema4 } from 'json-schema';

/** 请求方式 */
export enum Method {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
  PATCH = 'PATCH',
}

/** 字段是否必须 */
export enum Required {
  /** 不必需 */
  false = '0',
  /** 必需 */
  true = '1',
}

/** 请求数据类型 */
export enum RequestBodyType {
  /** 查询字符串 */
  query = 'query',
  /** 表单 */
  form = 'form',
  /** JSON */
  json = 'json',
  /** 纯文本 */
  text = 'text',
  /** 文件 */
  file = 'file',
  /** 原始数据 */
  raw = 'raw',
  /** 无请求数据 */
  none = 'none',
}

/** 请求formData类型 */
export enum ReqFormDataType {
  /** 纯文本 */
  text = 'text',
  /** 文件 */
  file = 'file',
}

/** 返回数据类型 */
export enum ResBodyType {
  /** JSON */
  json = 'json',
  /** 纯文本 */
  text = 'text',
  /** XML */
  xml = 'xml',
  /** 原始数据 */
  raw = 'raw',
}



export interface Interface {
  /** 接口 ID */
  _id: number,
  /** 接口名称 */
  title: string,
  /** 接口备注 */
  markdown: string,
  /** 请求路径 */
  path: string,
  /** 请求方式，HEAD、OPTIONS 处理与 GET 相似，其余处理与 POST 相似 */
  method: Method,
  /** 所属分类 id */
  catid: number,
  /** 仅 GET：请求串 */
  req_query: Array<{
    /** 名称 */
    name: string,
    /** 备注 */
    desc: string,
    /** 示例 */
    example: string,
    /** 是否必需 */
    required: Required,
  }>,
  /** 仅 POST：请求内容类型。为 text, file, raw 时不必特殊处理。 */
  req_body_type: RequestBodyType,
  /** `req_body_type = json` 时是否为 json schema */
  req_body_is_json_schema: boolean,
  /** `req_body_type = form` 时的请求内容 */
  req_body_form: Array<{
    /** 名称 */
    name: string,
    /** 类型 */
    type: ReqFormDataType,
    /** 备注 */
    desc: string,
    /** 示例 */
    example: string,
    /** 是否必需 */
    required: Required,
  }>,
  /** `req_body_type = json` 时的请求内容 */
  req_body_other: string,
  /** 返回数据类型 */
  res_body_type: ResBodyType,
  /** `res_body_type = json` 时是否为 json schema */
  res_body_is_json_schema: boolean,
  /** 返回数据 */
  res_body: string,
  [key: string]: any,
}

/** 最终输出的api类型 */
export interface IOutPut {
  /** 生成api 文件名称 */
  name: string,
  /** 接口url */
  path: string,
  method: Method,
  /** 接口名 */
  title: string,
  /** 接口备注 */
  markdown: string,
  /** 分类菜单id */
  catid: number,
  /** 接口ID */
  id: number,
  reqInterfaceName: string,
  resInterfaceName: string,
  requestInterface: string,
  responseInterface: string,
  /**
   * yapi 基础数据源，包含yapi该项接口所有源数据
   */
  yapiBaseInfo: object,
}


export interface ApiJsonItem {
  index: number,
  name: string,
  desc?: string,
  list: Interface[],
}

export type ApiJson = ApiJsonItem[]


export interface PropDefinition {
  /** 属性名称 */
  name: string,
  /** 是否必需 */
  required: boolean,
  /** 类型 */
  type: JSONSchema4['type'],
  /** 注释 */
  description: string,
}

export interface IProjectConfig {
  /**
   * 生成ts 、js版本
   */
  target: 'ts' | 'js',
  /**
   * 项目id
   * 'http://122.51.157.252:3000/project/11/interface/api/20' projectId 对应 11
   */
  projectId: string,
  /**
   * 输出api文件路径。
   * @example 'src/api'
   */
  outputFilePath: string,
  /**
   * 过滤需要比对的文件方法
   * currentGitBranch 当前git分支号
   */
  customizeFilter?:
  (api: Omit<IOutPut, 'reqInterfaceName' | 'resInterfaceName' | 'requestInterface' | 'responseInterface'>,options: {currentGitBranch: string}) => boolean,
  /**
   * 文件名称生成规则
   * @param  {string} path 接口路径 url
   * @param  {string} _id 接口id
   */
  generateApiName?: (path: string, _id: string | number) => string,
  /**
   * 自定义代码片段函数
   */
  generateApiFileTemplate?: (api: IOutPut) => string,
}

export type IYapiConfig ={
  /**
   * YApi 服务地址。
   *
   * @example 'http://122.51.157.252:3000'
   */
  serverUrl: string,
  projectConfigs:IProjectConfig[]
}
export type IYapiCookie = {
  /** cookie _yapi_token */
  _yapi_token: string,
  /** cookie _yapi_uid */
  _yapi_uid: string,
}