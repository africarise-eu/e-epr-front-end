import Joi from "joi";
import { useI18n } from "vue-i18n";
export const companyProfileSchema =()=>{ 
    const {t} = useI18n();    
    return Joi.object({
    companyName: Joi.string().max(50).required().messages({
        'string.base': t('company.validation.companyName.string'),
        'string.empty': t('company.validation.companyName.required'),
        'string.max': t("company.validation.companyName.max", {max: 50}),
        'any.required': t('company.validation.companyName.string'),
        'string.pattern.base': t('company.validation.companyName.pattern')
      }),
    type: Joi.array().min(1).required().messages({
      'any.required': t('company.validation.type.required'),
      'array.empty': t('company.validation.type.required'),
      'array.min': t('company.validation.type.required'),
    }),
    registrationNumber: Joi.string().pattern(/^[a-zA-Z0-9\s\-_*]+$/).max(50).required().messages({
      'string.base': t('company.validation.registrationNumber.string'),
      'string.empty': t('company.validation.registrationNumber.required'),
      'string.max': t("company.validation.registrationNumber.max", {max: 50}),
      'any.required': t('company.validation.registrationNumber.string'),
      'string.pattern.base': t('company.validation.registrationNumber.string')
    }),
    activityCode: Joi.string().pattern(/^[a-zA-Z0-9\s\-_*]+$/).max(50).required().messages({
      'number.base': t('company.validation.activityCode.string'),
      'number.empty': t('company.validation.activityCode.required'),
      'number.max': t("company.validation.activityCode.max", {max: 50}),
      'any.required': t('company.validation.activityCode.string'),
      'string.pattern.base': t('company.validation.activityCode.string')
    }),
    address: Joi.string().required().messages({
        'string.base': t('company.validation.address.string'),
        'string.empty': t('company.validation.address.required'),
        'string.max': t("company.validation.address.max", {max: 50}),
        'any.required': t('company.validation.address.string')
      }),
    city: Joi.object({
      id: Joi.number().integer().required(),
      name: Joi.string().required()
    }).messages({
      'object.base': t('company.validation.city.string'),
      'number.base': t('company.validation.city.string'),
      'number.integer': t('company.validation.city.string'),
      'any.required': t('company.validation.city.required'),
      'string.base': t('company.validation.city.string'),
      'string.empty': t('company.validation.city.required'),
    }),
    country: Joi.object({
      id: Joi.number().integer().required(),
      name: Joi.string().required(),
    }).messages({
      'object.base': 'company.validation.country.string',
      'number.base': 'company.validation.country.string',
      'number.integer': 'company.validation.country.string.',
      'any.required': 'company.validation.country.required',
      'string.base': t('company.validation.country.string'),
      'string.empty': t('company.validation.country.required'),
    }),
    companyPhoneNumber: Joi.string().max(12).pattern(/^[0-9]+$/).required().messages({
      'string.base': t('company.validation.companyPhoneNumber.string'),
      'string.empty': t('company.validation.companyPhoneNumber.required'),
      'string.max': t("company.validation.companyPhoneNumber.max", {max: 12}),
      'any.required': t('company.validation.companyPhoneNumber.string'),
      'string.pattern.base': t('company.validation.companyPhoneNumber.pattern')
    }),
    website: Joi.string().pattern(/^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,6}(\/[a-zA-Z0-9-._~:\/?#\[\]@!$&'()*+,;=]*)?$/).required().messages({
      'string.base': t('company.validation.website.string'),
      'string.empty': t('company.validation.website.required'),
      'any.required': t('company.validation.website.string'),
      'string.pattern.base': t('company.validation.website.uri')
    }),
    bankAccount: Joi.string().pattern(/^[a-zA-Z0-9]+$/).max(50).allow('',null).optional().messages({
      'string.base': t('company.validation.bankAccount.string'),
      'string.max': t("company.validation.bankAccount.max", {max: 50}),
      'string.pattern.base': t('company.validation.bankAccount.string')
    }),
    person: Joi.allow(null),
    logo: Joi.allow(null),
    isImageUpload: Joi.allow(null),
    imagePath: Joi.allow(null),

})
}
export const inviteUserSchema =()=>{ 
    const {t} = useI18n();    
    
    return Joi.object({
    firstName: Joi.string().pattern(/^[A-Za-z ]+$/).required().messages({
        'string.base': t('authentication.validation.firstName.string'),
        'string.empty': t('authentication.validation.firstName.required'),
        'string.min': t("authentication.validation.firstName.min", {min: 3}),
        'string.max': t("authentication.validation.firstName.max", {max: 50}),
        'any.required': t('authentication.validation.firstName.string'),
        'string.pattern.base': t('authentication.validation.firstName.pattern')
      }),
    lastName: Joi.string().max(50).pattern(/^[A-Za-z ]+$/).required().messages({
        'string.base': t('authentication.validation.lastName.string'),
        'string.empty': t('authentication.validation.lastName.required'),
        'string.min': t("authentication.validation.lastName.min", {min: 3}),
        'string.max': t("authentication.validation.lastName.max", {max: 50}),
        'any.required': t('authentication.validation.lastName.string'),
        'string.pattern.base': t('authentication.validation.lastName.pattern')
      }),
    email: Joi.string().email({tlds: {allow:false}}).required().messages({
        'string.email': t('authentication.validation.email.email'),
        'string.empty': t('authentication.validation.email.required'),
        'any.required': t('authentication.validation.email.required'),
      }),
})
}
export const adminInviteUserSchema =()=>{ 
    const {t} = useI18n();    
    
    return Joi.object({
    firstName: Joi.string().pattern(/^[A-Za-z ]+$/).required().messages({
        'string.base': t('admin.validation.firstName.string'),
        'string.empty': t('admin.validation.firstName.required'),
        'string.min': t("admin.validation.firstName.min", {min: 3}),
        'string.max': t("admin.validation.firstName.max", {max: 50}),
        'any.required': t('admin.validation.firstName.string'),
        'string.pattern.base': t('admin.validation.firstName.pattern')
      }),
    lastName: Joi.string().max(50).pattern(/^[A-Za-z ]+$/).required().messages({
        'string.base': t('admin.validation.lastName.string'),
        'string.empty': t('admin.validation.lastName.required'),
        'string.min': t("admin.validation.lastName.min", {min: 3}),
        'string.max': t("admin.validation.lastName.max", {max: 50}),
        'any.required': t('admin.validation.lastName.string'),
        'string.pattern.base': t('admin.validation.lastName.pattern')
      }),
    email: Joi.string().email({tlds: {allow:false}}).required().messages({
        'string.email': t('admin.validation.email.email'),
        'string.empty': t('admin.validation.email.required'),
        'any.required': t('admin.validation.email.required'),
      }),
    roleId: Joi.number().integer().required().valid(2,3).messages({
        'number.base': t('admin.validation.role.valid'),
        'number.integer': t('admin.validation.role.valid'),
        'any.required': t('admin.validation.role.required'),
        'any.only': t('admin.validation.role.valid')
    })
})
}
export const teamFilterSchema =()=>{
    const {t} = useI18n();
    return Joi.object({
      status: Joi.string().allow('', null).messages({
          'array.base': t('team.validation.name.string'),
      }),
    });
}