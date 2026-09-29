import { useContext } from "react";
import { LoaderContext } from "../contexts/LoaderContext";

export const applyFilterWithLoader = async (setLoader, callback) => {
    setLoader(true);
    try {
        await callback();
    } finally {
        setLoader(false);
    }
};
