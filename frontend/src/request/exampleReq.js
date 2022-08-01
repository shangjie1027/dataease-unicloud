import { util } from '~/util/axiosConf';

const baseURL = `/user`;

export default {
  getUserList: params => {
    return util.get(`${baseURL}/v1/users?${params}`);
  },
};
