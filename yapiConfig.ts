/* eslint-disable @typescript-eslint/ban-ts-comment */
const generateApiFileTemplate = (projectId: string) => (api) => {

  const arr = [
    `
    /* eslint-disable */
    // @ts-nocheck
    /**
      * ${api.title}
      * http://122.51.157.252:3000/project/${projectId}/interface/api/${api.id}
    **/

    // import api${api.id} from '@/apis/${projectId}/api${api.id}'
   // @ts-ignore
      import request from '@/utils/http.ts'

`,
    api.requestInterface,
    api.responseInterface
  ];
  const { yapiBaseInfo: { req_headers } } = api;
  const reqHeaders = req_headers.find((item) => item.name.trim() === 'service-name');
  const serverName = reqHeaders && reqHeaders.value ? reqHeaders.value : api.path.split('/')[2];


  const isRestful = api.path.includes('{');
  if (isRestful) {
    const reg = /\{.*?\}/g;

    const paramsKeys = api.path.match(reg).map((ele) => ele.replace('{', '').replace('}', ''));
    const paramsKeysStr = paramsKeys.reduce((prev, value) => {
      prev += `${value},`;
      return prev;
    }, '');

    arr.push(`
      export default (${paramsKeysStr} data?: IReq${api.id}, config?: boolean | { showMsg?: Boolean, needCatch?: Boolean }): Promise<${api.resInterfaceName}> => request({
        method: '${api.method}',
        url: '${api.path.replace(/\{/, '\'+').replace(/\}/, '')},
        yapi:'${projectId}',
        config: {
          headers: {
            'service-name': '${serverName}'
          }
        },
        data,
        ...typeof config === 'boolean' ? { showMsg: config } : config,
      })
    `);
  } else {
    arr.push(`
      export default (data?: IReq${api.id}, config?: boolean | { showMsg?: Boolean, needCatch?: Boolean }): Promise<${api.resInterfaceName}> => request({
        method: '${api.method}',
        url: '${api.path}',
        yapi:'${projectId}',
        config: {
          headers: {
            'service-name': '${serverName}'
          }
        },
        data,
        ...typeof config === 'boolean' ? { showMsg: config } : config,
      })
    `);
  }

  return arr.join('');
};

const genProject = (projectId:string) => {
  return {
    target: 'ts',
    outputFilePath: `src/apis/${projectId}`,
    projectId,
    generateApiName:(path, _id) => `api${_id}`,
    customizeFilter: (api, { currentGitBranch }) => {
      // 采用 git 分支号做多版本并行的标识
      // const { tag } = api.yapiBaseInfo;
      // console.log(currentGitBranch,777);
      // if (tag.includes(currentGitBranch)) {
      //   console.log(api.id);
      // }
      // return tag.includes(currentGitBranch);
      return true;
    },
    generateApiFileTemplate:generateApiFileTemplate(projectId)
  };
};

const config = {
  serverUrl: 'http://122.51.157.252:3000',
  projectConfigs:[
    genProject('11'),
    genProject('16')
  ]
};


module.exports = config;