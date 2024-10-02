export const AUTH = {
    LOGIN:"user/login",
    LOGOUT:"/user/logout"
}

export const COMPANY = {
    REGISTER:"/company/register",
    COMPANY_PROFILE: "/company/profile",
    LIST_USERS:"/company/list-users",
    INVITE_USER:"/company/invite-user",
    COMPANY_STATUS: "/company/status",
    LIST_COMPANY:"/company/list-company"
}

export const USER = {
    SEND_RESET_PASSWORD_OTP:"/user/send-otp",
    RESET_PASSWORD:"/user/reset-password",
    SEND_CHANGE_PASSWORD_OTP: "/user/change-password-otp",
    CHANGE_PASSWORD:"/user/change-password",
    VERIFY_OTP:"/user/verify-otp",
    INVITE_USER_SET_PASSWORD:"/user/invite-user/set-password"
}

export const PRODUCT = {
    TAE_FEES:"/product/getTAE_Fees",
    ADD:"/product/add",
    UPDATE:"/product/updateProduct",
    GETBYID:"/product/getProduct",
    GETALL:"/product/getAllProducts",
    DELETE:"/product",
    PRODUCTSEARCH:"/product/productName",
    GETALLAPPROVED:"/product/getApprovedProducts"
}
export const PRODUCTION={
    PRODUCTION_PLAN:"/production",
    LIST_PRODUCTION:"/production/list-product"
}
export const FILE = {
    UPLOAD:"file/upload",
    GET_FILE:"/file/signed-url",
    UPLOAD_MULTIPLE:"/file/upload-multiple"
}

export const IMPORT = {
    GET:"/imports/getImports",
    ADD:"/imports/addImports",
    UPDATE:"/imports/updateImports",
    DELETE:"/imports",
    GETTEASTATUS:"/imports/getTaeStatus",
    GETBYID:"/imports/getImport"
}

export const COMMON = {
    COUNTRY:"country",
    CITY:"city",
    PORTS:"ports", 
    GET_COUNTRIES: "/country",
    GET_CITIES: "/city",
}

export const MYACCOUNT = {
    UPDATE:"user/profile",
    VERIFY_OTP:"user/verify-email",
    VERIFYEMAIL: "user/verify-email-otp"
}

export const COMPENSATION = {
    ADD:"compensation/addCompensation",
    UPDATE:"compensation/updateCompensation",
    GET:"compensation/getAllCompensations",
    DELETE:"compensation/deleteCompensation",
    GETBYID:"/compensation/getCompensationById",
    GET_ED_ORG:"/compensation/getEndDestinations",
    ADD_ED_ORG:"/compensation/addEndDestination",
    GET_COMPENSATION:"/compensation/getTotalWeight",
    GET_ENDDESTINATIONS:"/compensation/getEndDestinationsByCompany",
    UPDATE_ENDDESTINATIONS:"/compensation/updateEndDestination",
    DELETE_ENDDESTINATIONS:"/compensation/deleteEndDestination",
    GET_BY_ID_ENDDESTINATIONS:"/compensation/getEndDestination",
}

export const TAEPAYMENT ={
    GET: "/taepayments/payment"
}


export const VERIFIER = {
    VERIFIER: "/verifier",
    VERIFIER_LIST:"/verifier/list-verifier",
    COMPANY_LIST:"/verifier/company",
    PRODUCT_LIST:"/verifier/product",
    MATERIAL: "/verifier/material",
    PRODUCTION:"/verifier/production",
    PRODUCTION_DETAIL:"/verifier/production-plan",
    COMPENSATION: "/compensation/getAllCompensations",
    COMPENSATION_VERIFY: "/verifier/compensation",    
    END_DESTINATION_LIST:"/verifier/end-destination",
    END_DESTINATION_UPDATE:"/verifier/end-destination",
    VERIFIER_LOG_LIST:"/verifier/logs",
    IMPORTS:"/verifier/import",
    PAYMENTS: "verifier/payment",
    LOG_HISTORY: "verifier/detailed-log",
    ALL_PRODUCTION: "verifier/all-production",
}

export const ADMIN = {
    INVITE_USER: "/admin/invite-user",
    USERS: "/admin/getAllUsers",
    USER_ACTIVATION: "/admin/toggleActivation",
    TAE_PAYMENT: "/admin/getTaePayments"
}