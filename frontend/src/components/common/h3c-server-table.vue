<template>
  <div v-loading="isLoading" class="server-table">
    <el-table
      ref="tableObj"
      v-bind="$attrs"
      :row-key="primaryKey"
      v-on="$listeners"
      @filter-change="filterChange"
      @sort-change="sortChange"
      :isServerTable="true"
      :data="tableData"
      :height="height"
      :page-size="pageSize"
      :current-page="currentPage"
    >
      <slot></slot>
    </el-table>
    <slot name="setting"></slot>
    <div
      style="border-top: 1px solid rgba(0, 0, 0, 0.20);"
      v-show="totalPage == 0"
    ></div>
    <div style="float: right; padding: 10px 0;" v-show="totalPage > 0">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
      ></el-pagination>
    </div>
  </div>
</template>

<script>
import Vue from 'vue';
import {
  _isUndefined,
  _isFunction,
  _isNaN,
  _isNull,
  _bind,
  _throttle,
} from '~/util/commonUtil';

const getTablePropList = function(slotsList) {
  let columnList = slotsList.filter(item => {
    return (
      item.componentOptions && item.componentOptions.tag == 'el-table-column'
    );
  });
  return columnList.map(item => {
    return item.componentOptions.propsData.prop || '';
  });
};

const getColumnById = function(table, columnId) {
  let column = null;
  table.columns.forEach(function(item) {
    if (item.id === columnId) {
      column = item;
    }
  });
  return column;
};

export default {
  props: {
    url: {
      type: String,
      default: '',
    }, //表格数据请求URL
    handleParam: {
      type: Function,
      default: null,
    }, //
    primaryKey: {
      type: String,
      default: 'uuid',
    }, //主键
    autoRefresh: {
      type: Boolean,
      default: false,
    },
    refreshTime: {
      type: Number,
      default: 10000,
    },
    height: {
      type: Number,
    },
    //接口必填的默认参数
    defaultParam: {
      type: Object,
      default: () => {
        return null;
      },
    },
    /*myFilter:{
                type:Object,
            }//自定义过滤条件*/
  },
  created: function() {
    //设置刷新频率
    this.getServerData = _throttle(_bind(this.getServerDataTemp, this), 200, {
      trailing: false,
    });
  },
  destroyed() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  },
  mounted: function() {
    this.refreshData();
  },
  watch: {
    //当url改变后
    url: function(newValue, oldValue) {
      if (newValue != oldValue) {
        this.currentPage = 1;
        this.getServerData();
      }
    },
    /*myFilter: function (newValue, oldValue) {
                if(newValue!=oldValue){
                    this.getServerData();
                }
            }*/
  },
  computed: {
    //总页数
    totalPage() {
      return Math.ceil(parseFloat(this.total / this.pageSize));
    },
  },
  methods: {
    initTable() {
      this.tableData = [];
      this.pageSize = 10;
      this.total = 0;
      this.currentPage = 1;
    },
    doCommand(command) {
      this.$refs.pageMenu.hide();
      this.currentPage = command;
    },
    /**
     * 获取请求参数
     * @param page 当前页
     * @param size 每页显示的条数
     * @param filterObj 过滤对象
     * @returns {*} 组合后的请求参数对象
     */
    defaultGetParam(page, size, filterObj) {
      let filterMap = {};

      this.tablePropList = getTablePropList(this.$slots.default);

      //遍历设置筛选条件
      if (filterObj) {
        Object.keys(filterObj).forEach(columnId => {
          const column = getColumnById(
            this.$refs.tableObj.store.states,
            columnId
          );
          // 只支持多列单个条件搜索，多条件请使用myFilter和别的组件从父组件传入
          filterMap[column.property] = column.filteredValue[0];
        });
      }
      // 设置表格列的搜索条件
      let columns = this.tablePropList.map(item => {
        return {
          data: item,
          name: '',
          search: {
            value: _isUndefined(filterMap[item]) ? '' : filterMap[item],
          },
        };
      });

      // todo 排序需要后端支持，并约定接口，暂时不支持
      // if (sortObj.prop) {
      //     var orders = [{
      //         column: this.tablePropList.indexOf(sortObj.prop),
      //         dir: sortObj.order == "ascending" ? "asc" : "desc"
      //     }];
      // }

      //执行操作回调
      if (_isFunction(this.handleParam)) {
        return this.handleParam({
          columns: columns,
          // order: orders,
          size: page,
          length: size,
        });
      }

      //创建返回
      filterMap.page = page;
      filterMap.size = size;

      return filterMap;
    },
    /**
     * 获取过滤请求参数
     * */
    getFilterParam(filterObj) {
      let filterMap = {};

      //遍历设置筛选条件
      if (filterObj) {
        Object.keys(filterObj).forEach(columnId => {
          const column = getColumnById(
            this.$refs.tableObj.store.states,
            columnId
          );
          // 只支持多列单个条件搜索，多条件请使用myFilter和别的组件从父组件传入
          filterMap[column.property] = column.filteredValue[0];
        });
      }

      return filterMap;
    },
    /**
     * 获得表格数据
     * @returns {*}
     */
    getServerDataTemp: function() {
      //如果有请求正在进行直接返回
      if (this.isLoading) {
        return;
      }
      let url = this.url,
        _self = this;
      //var states = this.$refs.tableObj.store.states;
      _self.isLoading = true;

      let pageParam = {
        size: this.pageSize,
        page: this.currentPage,
      };
      let allParams = {};
      this.$http_bi
        .get(url, {
          params: Object.assign(
            allParams,
            this.defaultParam,
            pageParam,
            this.searchParams,
            this.filterParams,
            this.sortParams
          ),
        })
        .then(result => {
          if (result) {
            let data = result.data || {};
            if (data.status) {
              //查询正确
              if (data.res) {
                if (
                  data.res.currentPage <= data.res.totalPages ||
                  data.res.totalPages === 0
                ) {
                  _self.total = data.res.totalCount || data.res.length || 0;

                  if (data.res.list) {
                    _self.tableData = data.res.list;
                  } else {
                    if (data.res instanceof Array) {
                      _self.tableData = data.res;
                    }
                  }
                } else {
                  _self.isLoading = false;
                  _self.currentPage = 1;
                  _self.getServerDataTemp();
                }
              }
              if (!_self.timer) {
                _self.timer = setInterval(_self.heart, _self.refreshTime);
              }
              _self.$emit('data-load-success', result);
            } else {
              //查询错误
              if (_self.timer) {
                clearInterval(_self.timer);
              } //停止自动刷新
              _self.initTable();
              _self.$emit('data-load-fail', result);
              console.error('后台数据查询失败');
            }
            //渲染完成后关闭遮罩
            Vue.nextTick(function() {
              _self.isLoading = false;
            });
          }
        })
        .catch(result => {
          _self.isLoading = false;
          _self.tableData = [];
          if (_self.timer) {
            clearInterval(_self.timer);
          } //停止自动刷新
          _self.initTable();
          _self.$emit('data-load-fail', result);
          console.error('后台数据接口状态异常');
        });
    },
    /**
     * 排序条件发生改变
     * @param  column
     * @param  prop
     * @param  order
     */
    sortChange(obj) {
      if (_isUndefined(obj.prop) || _isNaN(obj.prop) || _isNull(obj.prop))
        return;
      this.currentPage = 1;
      this.sortParams = {
        order: obj.prop.toUpperCase(),
        ascendingOrder: obj.order === 'ascending' ? 'ASC' : 'DESC',
      };
      this.getServerData();
      this.$emit('sort-change', obj.column, obj.prop, obj.order);
    },
    /**
     * 过滤条件改变
     * @param filters 过滤条件
     */
    filterChange(filters) {
      this.currentPage = 1;
      this.filterParams = this.getFilterParam(filters);
      this.getServerData();
      this.$emit('filter-change', filters);
    },
    /**
     * 重置过滤条件*/
    resetFilter() {
      this.$refs.tableObj.store.states.filters = {};
      let columns = this.$refs.tableObj.columns;
      columns.map(item => {
        if (item.filteredValue) {
          item.filteredValue = [];
        }
      });
      this.$emit('filter-change', []);
    },
    /**
     * 改变当前页回调
     * @param val
     */
    handleCurrentChange(val) {
      this.currentPage = val;
      this.getServerData();
      this.$emit('current-page-change', val);
    },
    /**
     * 改变每页显示数据大小
     * @param val
     */
    handleSizeChange(val) {
      this.pageSize = val;
      this.currentPage = 1;
      this.getServerData();
      this.$emit('size-change', val);
    },
    /**
     * 搜索表格
     * @param prop
     * @param value
     */
    searchTable(prop, value) {
      this.currentPage = 1;
      this.searchParams = {};
      this.searchParams[prop] = value;
      this.getServerData();
    },
    /**
     * 高级搜索
     * @param conditions
     */
    seniorSearchTable(conditions) {
      this.currentPage = 1;
      this.searchParams = {};
      if (conditions && conditions instanceof Array && conditions.length > 0) {
        conditions.forEach(item => {
          this.searchParams[item.prop] = item.value;
        });
      }
      this.getServerData();
    },
    /**
     * 根据列的key获得列的实例
     * @param prop 列的key
     * @returns {*}
     */
    getColumnByKey(prop) {
      return this.$refs.tableObj.store.states.columns.find(item => {
        return item.property === prop;
      });
    },
    /**
     * 获得表格的数据
     */
    getTableData() {
      return this.$refs.tableObj.store.states._data;
    },
    /**
     * 传入表格数据
     */
    setTableData(data) {
      this.tableData = data;
    },
    refreshData() {
      if (this.url != '') {
        this.getServerData();
      }
    },
    findTableDataByProp(prop, value) {
      if (_isUndefined(prop) || _isUndefined(value)) {
        return [];
      }
      return this.$refs.tableObj.store.states._data.filter(item => {
        return item[prop] == value;
      });
    },
    findTableData(predicate) {
      if (!_isFunction(predicate)) {
        return [];
      }
      return this.$refs.tableObj.store.states._data.filter(item => {
        return predicate(item);
      });
    },
    toggleRowSelection(row, selected) {
      return this.$refs.tableObj.toggleRowSelection(row, selected);
    },
    clearSelection() {
      return this.$refs.tableObj.clearSelection();
    },
    selectedRowOnlyOne(row) {
      const states = this.$refs.tableObj.store.states;
      states.isAllSelected = false;
      const oldSelection = states.selection;
      states.selection = [];
      states.selection.push(row);
      if (oldSelection.length !== 1 || oldSelection[0] != row) {
        this.$refs.tableObj.$emit('selection-change', states.selection);
      }
    },
    doLayout() {
      this.$refs.tableObj.doLayout();
    },
    /**
     * 自动刷新的心跳函数，不要直接调用
     */
    heart() {
      //如果是自动刷新未开启或正在进行手动刷新或者之前的自定刷新请求还没结束
      if (!this.autoRefresh || this.isLoading || this.hearting) {
        return;
      }
      let url = this.url,
        param,
        _self = this;
      let states = this.$refs.tableObj.store.states;

      //获得过滤参数
      param = this.defaultGetParam(
        this.currentPage,
        this.pageSize,
        states.filters
      );

      this.$http_bi
        .get(url, { params: param })
        .then(result => {
          if (result) {
            let data = result.data || {};
            if (data.status) {
              //查询正确
              if (data.res) {
                _self.total = data.res.totalCount;
                if (data.res.list) {
                  _self.tableData = data.res.list;
                }
              }
              _self.$emit('data-load-success');
            } else {
              //查询错误
              if (this.timer) {
                clearInterval(this.timer);
              } //停止自动刷新
              console.error('后台数据接口返回异常');
            }
          }
          this.hearting = false;
        })
        .catch(() => {
          if (this.timer) {
            clearInterval(this.timer);
          } //停止自动刷新
          this.hearting = false;
          console.error('后台数据接口返回状态异常');
        });
    },
  },
  data() {
    return {
      timer: null,
      isLoading: false,
      hearting: true,
      tableData: [],
      tablePropList: [],
      pageSize: 10,
      total: 0,
      currentPage: 1,
      searchParams: {}, //搜索参数
      filterParams: {}, //过滤参数
      sortParams: {}, //排序参数
    };
  },
};
</script>

<style scoped>
.el-dropdown-menu {
  max-height: 310px;
  overflow-y: auto;
  min-width: 50px;
}

.server-table {
  position: relative;
}

.setting-btn {
  position: absolute;
  top: 12px;
  right: 10px;
}
</style>
