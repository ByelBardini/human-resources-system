/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from "react";
import { useAviso as useAvisoHook } from "../hooks/useAvisos.js";
import ModalAviso from "../components/default/ModalAviso.jsx";

const AvisoContext = createContext();

export function AvisoProvider({ children }) {
  const aviso = useAvisoHook();

  return (
    <AvisoContext.Provider value={aviso}>
      {children}
      {aviso.aviso && (
        <ModalAviso
          texto={aviso.textoAviso}
          cor={aviso.corAviso}
          onClick={aviso.limparAviso}
        />
      )}
    </AvisoContext.Provider>
  );
}

export function useAviso() {
  return useContext(AvisoContext);
}
