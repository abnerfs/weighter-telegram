import moment from "moment";

export const msToDate = (ms: number) =>
    moment(ms).format('DD/MM/YYYY');