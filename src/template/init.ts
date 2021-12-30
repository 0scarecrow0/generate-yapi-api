import { IYapiConfigTemplateParams } from '../types/index';

export const yapiConfigTemplate=(params:IYapiConfigTemplateParams)=>{


  if (params.target === 'js') {
    return `
    const generateApiFileTemplate = (projectId) => (api) => {

      const arr = [
        \`
        /**
          * \${api.title}
          * ${params.serverUrl}/project/\${projectId}/interface/api/\${api.id}
        **/
        // import api\${api.id} from '@/apis/\${projectId}/api\${api.id}'
          import request from '@/http'
        \`,
      ];
      /** 如果路径中存在{} 则需要替换掉 */
      const Reg = /\{(.+?)\}/g;
      const isSatisfyReg = Reg.test(api.path);
      if (isSatisfyReg) {
        const paramsKeys = api.path.match(Reg).map((el) => el.replace('{', '').replace('}', ''));
        const paramsKeysStr = paramsKeys.reduce((prev, value) => { prev += \`\${value},\`;return prev;}, '');
        arr.push(\`
          export default (\${paramsKeysStr} data) => request({
            method: '\${api.method}',
            url: \${api.path.replace(Reg,'+$1')},
            yapi:'\${projectId}',
            data,
          })
        \`);
      } else {
        arr.push(\`
          export default (data) => request({
            method: '\${api.method}',
            url: '\${api.path}',
            yapi:'\${projectId}',
            data,
          })
        \`);
      }
      return arr.join('');
    };

    const genProject = (projectId) => {
      return {
        target: '${params.target}',
        outputFilePath: \`${params.outputFilePath}/\${projectId}\`,
        projectId,
        generateApiName:(path, _id) => \`api\${_id}\`,
        customizeFilter: (api, { currentGitBranch }) => {
          // 采用 git 分支号做接口过滤
          const { tag } = api.yapiBaseInfo;
          return tag.includes(currentGitBranch);
        },
        generateApiFileTemplate:generateApiFileTemplate(projectId)
      };
    };
    const config = {
      serverUrl: '${params.serverUrl}',
      projectConfigs: [${params.projectIds.map(el=>`genProject('${el}')`)}]
    };

    module.exports = config;`;
  }
  return `

    import { IYapiConfig,IProjectConfig,IOutPut } from 'yapi-to-api';

    const generateApiFileTemplate = (projectId: string) => (api:IOutPut) => {

      const arr = [
        \`
        /**
          * \${api.title}
          * ${params.serverUrl}/project/\${projectId}/interface/api/\${api.id}
        **/
        // import api\${api.id} from '@/apis/\${projectId}/api\${api.id}'
        // @ts-ignore
          import request from '@/http'
        \`,
        api.requestInterface,
        api.responseInterface
      ];
      /** 如果路径中存在{} 则需要替换掉 */
      const Reg = /\{(.+?)\}/g;
      const isSatisfyReg = Reg.test(api.path);
      if (isSatisfyReg) {
        const paramsKeys = api.path.match(Reg).map((el:string) => el.replace('{', '').replace('}', ''));
        const paramsKeysStr = paramsKeys.reduce((prev:string, value:string) => { prev += \`\${value},\`;return prev;}, '');
        arr.push(\`
          export default (\${paramsKeysStr} data?: \${api.reqInterfaceName}): Promise<\${api.resInterfaceName}> => request({
            method: '\${api.method}',
            url: \${api.path.replace(Reg,'+$1')},
            yapi:'\${projectId}',
            data,
          })
        \`);
      } else {
        arr.push(\`
          export default (data?: \${api.reqInterfaceName}): Promise<\${api.resInterfaceName}> => request({
            method: '\${api.method}',
            url: '\${api.path}',
            yapi:'\${projectId}',
            data,
          })
        \`);
      }
      return arr.join('');
    };

    const genProject = (projectId:string):IProjectConfig => {
      return {
        target: '${params.target}',
        outputFilePath: \`${params.outputFilePath}/\${projectId}\`,
        projectId,
        generateApiName:(path, _id) => \`api\${_id}\`,
        customizeFilter: (api, { currentGitBranch }) => {
          return true
        },
        generateApiFileTemplate:generateApiFileTemplate(projectId)
      };
    };
    const config:IYapiConfig = {
      serverUrl: '${params.serverUrl}',
      projectConfigs: [ ${params.projectIds.map(el=>`genProject('${el}')`)} ]
    };

    module.exports = config;`;
};