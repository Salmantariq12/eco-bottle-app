import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { api } from '../lib/apiClient';

const schema = yup.object({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters'),
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address'),
  phoneNumber: yup
    .string()
    .matches(/^[\d\s\-\+\(\)]+$/, 'Please enter a valid phone number')
    .optional(),
  quantity: yup
    .number()
    .required('Quantity is required')
    .positive('Quantity must be positive')
    .integer('Quantity must be a whole number')
    .min(1, 'Minimum quantity is 1')
    .max(10, 'Maximum quantity is 10'),
  address: yup.object({
    street: yup.string().required('Street address is required'),
    city: yup.string().required('City is required'),
    state: yup.string().required('State is required'),
    zipCode: yup
      .string()
      .required('ZIP code is required')
      .matches(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code'),
    country: yup.string().default('USA')
  })
}).required();

const CheckoutForm = ({ selectedProduct, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid, touchedFields }
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: {
      quantity: 1,
      address: {
        country: 'USA'
      }
    }
  });

  const quantity = watch('quantity', 1);
  const totalAmount = selectedProduct ? (selectedProduct.price * quantity).toFixed(2) : 0;

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await api.leads.create({
        ...data,
        productId: selectedProduct._id
      });

      setSubmitStatus({
        type: 'success',
        message: `Order received! Your order ID is ${response.data.orderId}`
      });
      setShowConfirmation(true);

      setTimeout(() => {
        onSuccess(response.data);
        onClose();
      }, 3000);
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: error.response?.data?.error || 'Failed to submit order. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!selectedProduct) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Complete Your Order</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showConfirmation ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-12 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Order Confirmed!</h3>
              <p className="text-gray-600">{submitStatus?.message}</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="p-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{selectedProduct.name}</h3>
                    <p className="text-sm text-gray-600">${selectedProduct.price} each</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    {...register('name')}
                    className={`input-field ${errors.name ? 'border-red-500' : touchedFields.name && !errors.name ? 'border-green-500' : ''}`}
                    placeholder="John Doe"
                  />
                  {errors.name && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="error-text"
                    >
                      {errors.name.message}
                    </motion.p>
                  )}
                </motion.div>

                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    className={`input-field ${errors.email ? 'border-red-500' : touchedFields.email && !errors.email ? 'border-green-500' : ''}`}
                    placeholder="john@example.com"
                  />
                  {errors.email && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="error-text"
                    >
                      {errors.email.message}
                    </motion.p>
                  )}
                </motion.div>

                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      {...register('phoneNumber')}
                      className="input-field"
                      placeholder="(555) 123-4567"
                    />
                    {errors.phoneNumber && (
                      <p className="error-text">{errors.phoneNumber.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity *
                    </label>
                    <input
                      {...register('quantity')}
                      type="number"
                      className={`input-field ${errors.quantity ? 'border-red-500' : ''}`}
                      min="1"
                      max="10"
                    />
                    {errors.quantity && (
                      <p className="error-text">{errors.quantity.message}</p>
                    )}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="border-t pt-4"
                >
                  <h3 className="font-medium text-gray-700 mb-3">Shipping Address</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Street Address *
                      </label>
                      <input
                        {...register('address.street')}
                        className={`input-field ${errors.address?.street ? 'border-red-500' : ''}`}
                        placeholder="123 Main St"
                      />
                      {errors.address?.street && (
                        <p className="error-text">{errors.address.street.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City *
                        </label>
                        <input
                          {...register('address.city')}
                          className={`input-field ${errors.address?.city ? 'border-red-500' : ''}`}
                          placeholder="New York"
                        />
                        {errors.address?.city && (
                          <p className="error-text">{errors.address.city.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State *
                        </label>
                        <input
                          {...register('address.state')}
                          className={`input-field ${errors.address?.state ? 'border-red-500' : ''}`}
                          placeholder="NY"
                        />
                        {errors.address?.state && (
                          <p className="error-text">{errors.address.state.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ZIP Code *
                        </label>
                        <input
                          {...register('address.zipCode')}
                          className={`input-field ${errors.address?.zipCode ? 'border-red-500' : ''}`}
                          placeholder="10001"
                        />
                        {errors.address?.zipCode && (
                          <p className="error-text">{errors.address.zipCode.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Country
                        </label>
                        <input
                          {...register('address.country')}
                          className="input-field"
                          placeholder="USA"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {submitStatus && submitStatus.type === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"
                >
                  <p className="text-red-700">{submitStatus.message}</p>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 border-t pt-4"
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-medium text-gray-700">Total Amount:</span>
                  <span className="text-2xl font-bold text-primary-600">${totalAmount}</span>
                </div>

                <div className="flex gap-4">
                  <motion.button
                    type="submit"
                    disabled={!isValid || isSubmitting}
                    whileHover={{ scale: isValid && !isSubmitting ? 1.02 : 1 }}
                    whileTap={{ scale: isValid && !isSubmitting ? 0.98 : 1 }}
                    className={`flex-1 btn-primary flex items-center justify-center gap-2 ${
                      isSubmitting ? 'opacity-75' : ''
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Place Order
                      </>
                    )}
                  </motion.button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-secondary"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </form>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default CheckoutForm;