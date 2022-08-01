import Eev from 'eev';
import globalEventName from './globalEventName';

function initGlobalStore(store) {
  const eev = new Eev();

  let globalEventDistributor = store.state.index.globalEventDistributor;
  let storeDataMapping = globalEventDistributor.storeDataMapping;

  Object.keys(storeDataMapping).forEach(name => {
    store.state.index[name] = storeDataMapping[name];
  });

  eev.on(globalEventName.UPDATE_UNI_NAV_COLLAPSED, isNavCollapsed => {
    store.commit(
      `index/${globalEventName.UPDATE_UNI_NAV_COLLAPSED}`,
      isNavCollapsed
    );
  });

  store.state.index.globalEventDistributor.registerStore(eev);
}

export default initGlobalStore;
