import { createStore } from "redux";

// Начальный пустой редьюсер (будет расширяться при необходимости)
const initialReducer = (state = {}, action) => {
  switch (action.type) {
    default:
      return state;
  }
};

// Создание хранилища Redux
const store = createStore(initialReducer);

export default store;
