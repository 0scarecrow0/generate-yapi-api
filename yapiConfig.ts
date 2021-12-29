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
    serverUrl: 'http://122.51.157.252:3000',
    outputFilePath: `src/apis/${projectId}`,
    projectId,
    generateApiFileTemplate:generateApiFileTemplate(projectId)
  };
};

const configs = [
  genProject('11'),
  genProject('16')
];


module.exports = configs;