'use client'

import React, { useState } from 'react'

import RequestCodeForm from '@/app/(auth)/forget-password/_components/forget-password-form'
import NewPasswordForm from '@/app/(auth)/forget-password/_components/new-password-form'

const ForgetPassword = () => {
  const [phoneNumber, setPhoneNumber] = useState<string>()

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">فراموشی رمز عبور</h1>
        <p className="text-muted-foreground text-balance">
          ویرایش رمز عبور با استفاده از نام کاربری و کد تایید
        </p>
      </div>

      {phoneNumber ? (
        <NewPasswordForm
          phoneNumber={phoneNumber}
          onModifyPhoneNumber={setPhoneNumber}
        />
      ) : (
        <RequestCodeForm onSuccess={setPhoneNumber} />
      )}
    </div>
  )
}
export default ForgetPassword
