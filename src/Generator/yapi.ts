import request from 'request-promise-native';
import JSON5 from 'json5';
import consola from 'consola';
import { JSONSchema4 } from 'json-schema';
import { propDefinitionsToJsonSchema,jsonSchemaStringToJsonSchema,jsonToJsonSchema,jsonSchemaToType,mockjsTemplateToJsonSchema } from '../utils/yapi';
import { ApiJson, Interface, IOutPut, IYapiConfig, Method, PropDefinition, RequestBodyType, ReqFormDataType, Required, ResBodyType } from '../types';


export class yapiGenerator {

  yapiConfig:IYapiConfig;
  userInfo:{email:string,password:string}={email:'',password:''};
  yapiCookie:{_yapi_token:string,_yapi_uid:string}={_yapi_token:'',_yapi_uid:''};

  constructor (config:IYapiConfig){
    this.yapiConfig = config;
  }


  /** 登录yapi  获取token uid */
  async login({email, password} = this.userInfo) {
    const { serverUrl } = this.yapiConfig;
    try {
      const res = await request({
        method: 'POST',
        uri: `${serverUrl}/api/user/login`,
        body: { email,password },
        json: true,
        resolveWithFullResponse: true
      });
      const [cookie0, cookie1] = res.headers['set-cookie'];
      const _yapi_token = cookie0.split(';')[0].split('=')[1];
      const _yapi_uid = cookie1.split(';')[0].split('=')[1];
      consola.success('账户已登录');
      this.yapiCookie = { _yapi_token, _yapi_uid };
    } catch (e) {
      consola.error('yapi登录异常');
      return Promise.reject(e);
    }
  }


  /** 获取projectId项目中所有的api接口 */
  async getProjectApiList({ _yapi_token,_yapi_uid } = this.yapiCookie):Promise<ApiJson>{
    try {
      const { projectId, serverUrl } = this.yapiConfig;
      const res = await request({
        method: 'GET',
        uri: `${serverUrl}/api/plugin/export?type=json&pid=${projectId}&status=all&isWiki=false`,
        json: true,
        headers: { Cookie: `_yapi_token=${_yapi_token};_yapi_uid=${_yapi_uid}` }
      });
      return res;
    } catch (error) {
      consola.error(`yapi 拉取projectId:${this.yapiConfig.projectId}项目下apiList异常`);
      return Promise.reject(error);
    }
  }


  /** 过滤接口 并生成ts接口文件 */
  async customFiltering (apijson:ApiJson):Promise<IOutPut[]> {

    const { customizeFilter } = this.yapiConfig;
    const apiFileList = await Promise.all(apijson.map(async catItem=>{
      const { list,...other } = catItem;
      /** 获取到分类下的接口后 过滤数据接口 */
      const newApiList = list.filter(apiItem=>{
        // 重新整理api 用于过滤
        const { path,_id } = apiItem;
        const newApiItem = {
          ...apiItem,
          id: _id,
          name: this.generateApiName({path,_id}),
          yapiBaseInfo: {
            ...apiItem
          }
        };
        return customizeFilter ? customizeFilter(newApiItem,{currentGitBranch:'12333'}) : true;
      });

      /** 过滤之后 生成api类型文件 */
      const apiFileTypeList = await Promise.all(newApiList.map(async apiTypeItem=>{
        const name = this.generateApiName({path: apiTypeItem.path,_id: apiTypeItem._id});
        const reqInterfaceName = `IReq${name}`;
        const resInterfaceName = `IRes${name}`;
        const requestInterface =await this.generateReqDataType(apiTypeItem,reqInterfaceName);
        const responseInterface = await this.generateResponseDataType({
          interfaceInfo: apiTypeItem,
          typeName: resInterfaceName,
          dataKey: this.yapiConfig.projectId
        });
        return {
          reqInterfaceName,
          requestInterface,
          resInterfaceName,
          responseInterface,
          ...apiTypeItem
        };
      })) ;
      return {
        ...other,
        list: apiFileTypeList
      };
    }));

    /** 筛选出数据结果后，将数据装饰一层，供开发使用  */
    const arr: IOutPut[] = [];
    apiFileList.forEach(({list}) => {
      list.forEach(fileApi => {
        const { path, _id } = fileApi;
        const name = this.generateApiName({path,_id});
        const item = {
          id: fileApi._id,
          catid: fileApi.catid,
          path: fileApi.path,
          name,
          method: fileApi.method,
          title: fileApi.title,
          markdown: fileApi.markdown || '',
          reqInterfaceName: fileApi.reqInterfaceName,
          resInterfaceName: fileApi.resInterfaceName,
          requestInterface: fileApi.requestInterface,
          responseInterface: fileApi.responseInterface,
          yapiBaseInfo: {
            ...fileApi
          }
        };
        arr.push(item);
      });
    });

    return arr;

  }



  /** 生成请求数据类型 */
  async generateReqDataType(interfaceInfo:Interface,typeName:string):Promise<string>{
    let jsonSchema:JSONSchema4 = {};
    switch (interfaceInfo.method) {
      case Method.GET:
      case Method.HEAD:
      case Method.OPTIONS:
        jsonSchema = propDefinitionsToJsonSchema(
          interfaceInfo.req_query.map<PropDefinition>(item => ({
            name: item.name,
            required: item.required === Required.true,
            type: 'string',
            description: item.desc
          })),
        );
        break;

      default:
        switch (interfaceInfo.req_body_type) {
          case RequestBodyType.form:
            jsonSchema = propDefinitionsToJsonSchema(
              interfaceInfo.req_body_form.map<PropDefinition>(item => ({
                name: item.name,
                required: item.required === Required.true,
                type: (item.type === ReqFormDataType.file ? 'file' : 'string') as JSONSchema4['type'],
                description: item.desc
              })));
            break;

          case RequestBodyType.json:
            if (interfaceInfo.req_body_other) {
              jsonSchema = interfaceInfo.req_body_is_json_schema ? jsonSchemaStringToJsonSchema(interfaceInfo.req_body_other) : jsonToJsonSchema(JSON5.parse(interfaceInfo.req_body_other));
            }
            break;

          default:
            break;
        }
        break;
    }
    return jsonSchemaToType(jsonSchema,typeName);
  }

  /** 生成响应数据类型 */
  async generateResponseDataType({ interfaceInfo, typeName, dataKey }: {interfaceInfo: Interface,typeName: string,dataKey?: string}): Promise<string> {
    let jsonSchema: JSONSchema4 = {};
    switch (interfaceInfo.res_body_type) {
      case ResBodyType.json:
        if (interfaceInfo.res_body) {
          jsonSchema = interfaceInfo.res_body_is_json_schema
            ? jsonSchemaStringToJsonSchema(interfaceInfo.res_body)
            : mockjsTemplateToJsonSchema(JSON5.parse(interfaceInfo.res_body));
        }
        break;
      default:
        return `export type ${typeName} = any`;
    }
    if (dataKey && jsonSchema && jsonSchema.properties && jsonSchema.properties[dataKey]) {
      jsonSchema = jsonSchema.properties[dataKey];
    }
    return jsonSchemaToType(jsonSchema, typeName);
  }


  /** 生成可写入的api数据 */
  async generateApiList ({email,password}:{email:string,password:string}):Promise<IOutPut[]>{
    try {
      this.userInfo = {email,password};
      /** 1.登录 */
      await this.login();

      /** 2.获取projectId下的接口 */
      const apiList = await this.getProjectApiList();

      /** 过滤数据并生成 ts类型文件 */
      return await this.customFiltering(apiList);

    } catch (error) {
      return Promise.reject(error);
    }
  }

  /** 生成api名称 */
  generateApiName({path,_id}: {path: string,_id: string | number,}): string {
    if (this.yapiConfig.generateApiName) {
      return this.yapiConfig.generateApiName(path, _id);
    }
    return String(_id);
  }

}