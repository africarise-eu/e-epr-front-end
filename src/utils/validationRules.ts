import Joi from "joi";
import { useI18n } from "vue-i18n";
export const companyRegistrationSchema =()=>{ 
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
    password: Joi.string().min(8).max(32).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/).required().messages({
        'string.empty': t('authentication.validation.password.required'),
        'string.min': t("authentication.validation.password.min", {min: 8}),
        'string.max': t("authentication.validation.password.max", {max: 32}),
        'any.required': t('authentication.validation.password.required'),
        'string.pattern.base': t('authentication.validation.password.pattern')
      }),
    company: Joi.allow(null)
})
}
export const loginSchema =()=>{ 
  const {t} = useI18n();    
  
  return Joi.object({
  email: Joi.string().email({tlds: {allow:false}}).required().messages({
      'string.email': t('authentication.validation.email.email'),
      'string.empty': t('authentication.validation.email.required'),
      'any.required': t('authentication.validation.email.required'),
    }),
  password: Joi.string().min(8).max(32).required().messages({
      'string.empty': t('authentication.validation.password.required'),
      'string.min': t("authentication.validation.password.invalid"),
      'string.max': t("authentication.validation.password.invalid"),
      'any.required': t('authentication.validation.password.required')
    }),
})
}
export const otpVerificationSchema =()=>{ 
  const {t} = useI18n();    
  
  return Joi.object({
    otp: Joi.string().min(6).max(6).required().messages({
      'string.empty': t('authentication.validation.otp.required'),
      'string.min': t("authentication.validation.otp.min", {min: 6}),
      'string.max': t("authentication.validation.otp.max", {max: 6}),
      'any.required': t('authentication.validation.otp.required'),
    }),
})
}

export const changePasswordSchema =()=>{ 
  const {t} = useI18n();    
  
  return Joi.object({
    currentPassword: Joi.string().min(8).max(32).required().messages({
      'string.empty': t('authentication.validation.currentPassword.required'),
      'string.min': t("authentication.validation.currentPassword.min", {min: 8}),
      'string.max': t("authentication.validation.currentPassword.max", {max: 32}),
      'any.required': t('authentication.validation.currentPassword.required'),
    }),
  password: Joi.string().min(8).max(32).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/).required().messages({
      'string.empty': t('authentication.validation.password.required'),
      'string.min': t("authentication.validation.password.min", {min: 8}),
      'string.max': t("authentication.validation.password.max", {max: 32}),
      'any.required': t('authentication.validation.password.required'),
      'string.pattern.base': t('authentication.validation.password.pattern')
    }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).messages({
      'string.empty': t('authentication.validation.confirmPassword.required'),
      'string.min': t("authentication.validation.confirmPassword.min", {min: 8}),
      'string.max': t("authentication.validation.confirmPassword.max", {max: 32}),
      'any.equal': t('authentication.validation.confirmPassword.required'),
      'any.only':  t('authentication.validation.confirmPassword.only'),
    }),
})
}

export const resetPasswordSchema =()=>{ 
  const {t} = useI18n();    
  
  return Joi.object({
  password: Joi.string().min(8).max(32).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/).required().messages({
      'string.empty': t('authentication.validation.password.required'),
      'string.min': t("authentication.validation.password.min", {min: 8}),
      'string.max': t("authentication.validation.password.max", {max: 32}),
      'any.required': t('authentication.validation.password.required'),
      'string.pattern.base': t('authentication.validation.password.pattern')
    }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).messages({
      'string.empty': t('authentication.validation.confirmPassword.required'),
      'string.min': t("authentication.validation.confirmPassword.min", {min: 8}),
      'string.max': t("authentication.validation.confirmPassword.max", {max: 32}),
      'any.equal': t('authentication.validation.confirmPassword.required'),
      'any.only':  t('authentication.validation.confirmPassword.only'),
    }),
})
}
export const forgotPasswordSchema =()=>{ 
  const {t} = useI18n();    
  
  return Joi.object({
    email: Joi.string().email({tlds: {allow:false}}).required().messages({
      'string.email': t('authentication.validation.email.email'),
      'string.empty': t('authentication.validation.email.required'),
      'any.required': t('authentication.validation.email.required'),
    })
  })
}

export const productSchema = () => {
  const { t } = useI18n();

  return Joi.object({
    productName: Joi.string().required().messages({
      'string.empty': t('product.validation.productName.required'),
      'any.required': t('product.validation.productName.required'),
    }),
    productCategory: Joi.string().required().messages({
      'string.empty': t('product.validation.productCategory.required'),
      'any.required': t('product.validation.productCategory.required'),
    }),
    image: Joi.string().required().messages({
      'string.empty': t('product.validation.image.required'),
      'any.required': t('product.validation.image.required'),
    }),
    production: Joi.string().required().messages({
      'string.empty': t('product.validation.production.required'),
      'any.required': t('product.validation.production.required'),
    }),
    manufacturerCompany: Joi.string().required().messages({
      'string.empty': t('product.validation.manufacturerCompany.required'),
      'any.required': t('product.validation.manufacturerCompany.required'),
    }),
    countryOfManufacture: Joi.number().required().messages({
      'any.required': t('product.validation.countryOfManufacture.required'),
    }),
    brandName: Joi.string().required().messages({
      'string.empty': t('product.validation.brandName.required'),
      'any.required': t('product.validation.brandName.required'),
    }),
    productModelTypeVolume: Joi.string().required().messages({
      'string.empty': t('product.validation.productModelTypeVolume.required'),
      'any.required': t('product.validation.productModelTypeVolume.required'),
    }),
    barcode: Joi.string().required().messages({
      'string.empty': t('product.validation.barcode.required'),
      'any.required': t('product.validation.barcode.required'),
    }),
    internalArticleCode: Joi.string().required().messages({
      'string.empty': t('product.validation.internalArticleCode.required'),
      'any.required': t('product.validation.internalArticleCode.required'),
    }),
    packingMaterials: Joi.array().items().min(1).required().messages({
      'array.min': t('product.validation.packingMaterials.required')
    }),
  });
};

export const importSchema = () => {
  const { t } = useI18n();

  return Joi.object({
    cdNo: Joi.string().required().messages({
      'string.empty': t('import.validation.cdNo.required'),
      'any.required': t('import.validation.cdNo.required'),
    }),
    arrivalPort: Joi.number().required().messages({
      'any.required': t('import.validation.arrivalPort.required'),
    }),
    countryId: Joi.number().required().messages({
      'any.required': t('import.validation.countryId.required'),
    }),
    fromPort: Joi.string().required().messages({
      'string.empty': t('import.validation.fromPort.required'),
      'any.required': t('import.validation.fromPort.required'),
    }),
    products: Joi.array().items().min(1).required().messages({
      'array.min': t('import.validation.products.required')
    }),
  });
};

export const myAccountSchema =()=>{ 
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
    })
   })
  };

export const productionSchema = () => {
  const { t } = useI18n();
  return Joi.array().items(Joi.object({
    actuals: Joi.number().min(0).required().messages({
      'number.base': t('production.validation.actual.number'),
      'any.required': t('production.validation.actual.required'),
      'string.min': t("production.validation.actual.min"),
    }),
    plan: Joi.number().min(1).required().messages({
      'number.base': t('production.validation.plan.number'),
      'any.required': t('production.validation.plan.required'),
      'number.min': t("production.validation.plan.min"),
    }),
  }))
}
export const productionDraftSchema = () => {
  const { t } = useI18n();
  return Joi.array().items(Joi.object({
    actuals: Joi.number().min(0).allow(null, '').messages({
      'number.base': t('production.validation.actual.number'),
      'number.min': t("production.validation.plan.min"),
    }),
    plan: Joi.number().min(0).allow(null, '').messages({
      'number.base': t('production.validation.plan.number'),
      'number.min': t("production.validation.plan.min"),
    }),
  }))
}

export const compensationRequestSchema = () => {
  const { t } = useI18n();
  return Joi.object({
    materialId: Joi.number().required().messages({
      'number.base': t('compensationRequest.validation.materialId.required'),
    }),
    edOrganisationId: Joi.number().required().messages({
      'number.base': t('compensationRequest.validation.edOrganisationId.required'),
    }),
    deliveredKgs: Joi.number().greater(0).required().messages({
      'number.base': t('compensationRequest.validation.deliveredKgs.required'),
      'number.greater': t('compensationRequest.validation.deliveredKgs.required')
    }),
    documents: Joi.array().items().min(1).required().messages({
      'array.min': t('compensationRequest.validation.documents.required')
    }),
  });
}

export const endDestinationSchema = () => {
  const { t } = useI18n();
  return Joi.object({
    orgName: Joi.string().required().messages({
      'string.empty': t('endDestination.validation.orgName.required'),
      'any.required': t('endDestination.validation.orgName.required'),
    }),
    orgType: Joi.string().required().messages({
      'string.base': t('endDestination.validation.orgType.required'),
    }),
    companyRegNo:  Joi.string().required().messages({
      'string.empty': t('endDestination.validation.companyRegNo.required'),
      'any.required': t('endDestination.validation.companyRegNo.required'),
    }),
    address: Joi.string().required().messages({
      'string.empty': t('endDestination.validation.address.required'),
      'any.required': t('endDestination.validation.address.string')
    }), 
    contactPerson: Joi.string().required().messages({
      'string.empty': t('endDestination.validation.contactPerson.required'),
      'any.required': t('endDestination.validation.contactPerson.required'),
    }),
    email: Joi.string().email({tlds: {allow:false}}).required().messages({
      'string.email': t('authentication.validation.email.email'),
      'string.empty': t('authentication.validation.email.required'),
      'any.required': t('authentication.validation.email.required'),
    }),
    country: Joi.number().required().messages({
      'number.base': t('endDestination.validation.country.required'),
    }),
    phone: Joi.string().pattern(/^[0-9]+$/).required().messages({
      'string.empty': t('endDestination.validation.phone.required'),
      'any.required': t('endDestination.validation.phone.string'),
      'string.pattern.base': t('endDestination.validation.phone.pattern')
    })
  });
}

export const rejectedReasonSchema =()=>{ 
  const {t} = useI18n();    
  
  return Joi.object({
    reason: Joi.string().required().messages({
      'string.base': t('verifier.validation.reason.string'),
      'string.empty': t('verifier.validation.reason.required'),
      'any.required': t('verifier.validation.reason.required'),
    })
   })
  };