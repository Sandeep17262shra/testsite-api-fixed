import { createContext, useState } from "react";

export const View360Context = createContext(false);

export const View360Provider = ({ children }) => {
  const [ view360, setView360 ] = useState(false);

  return (
    <View360Context.Provider value={{ view360, setView360 }}>
      {children}
    </View360Context.Provider>
  );
};
