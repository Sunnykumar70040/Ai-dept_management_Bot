"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import type { Debt } from "./debt-management-coach"
import { BarChart3, Calendar, TrendingDown } from "lucide-react"

interface PaymentPlanProps {
  debts: Debt[]
  monthlyBudget: number
  strategy: "avalanche" | "snowball" | "highestPaymentFirst" | "lowestPaymentFirst"
}

interface MonthlyPayment {
  month: number
  payments: {
    debtId: string
    amount: number
    remainingBalance: number
    isPaidOff: boolean
  }[]
  totalRemaining: number
  totalPaid: number
  totalInterestPaid: number
}

const PaymentPlan = ({ debts, monthlyBudget, strategy }: PaymentPlanProps) => {
  const [paymentSchedule, setPaymentSchedule] = useState<MonthlyPayment[]>([])
  const [totalMonths, setTotalMonths] = useState(0)
  const [totalInterestPaid, setTotalInterestPaid] = useState(0)
  const [totalPaid, setTotalPaid] = useState(0)

  useEffect(() => {
    calculatePaymentPlan()
  }, [debts, monthlyBudget, strategy])

  const calculatePaymentPlan = () => {
    // Clone debts to avoid modifying the original
    const workingDebts = debts.map((debt) => ({
      ...debt,
      remainingBalance: debt.balance,
      isPaidOff: false,
    }))

    const schedule: MonthlyPayment[] = []
    let month = 1
    let totalPaid = 0
    let totalInterestPaid = 0

    // Continue until all debts are paid off
    while (workingDebts.some((debt) => !debt.isPaidOff) && month <= 600) {
      // Limit to 50 years (600 months)
      let remainingBudget = monthlyBudget
      const monthlyPayments: MonthlyPayment["payments"] = []

      // First, make minimum payments on all debts
      workingDebts.forEach((debt) => {
        if (debt.isPaidOff) {
          monthlyPayments.push({
            debtId: debt.id,
            amount: 0,
            remainingBalance: 0,
            isPaidOff: true,
          })
          return
        }

        // Calculate interest for this month
        const monthlyInterestRate = debt.interestRate / 100 / 12
        const interestThisMonth = debt.remainingBalance * monthlyInterestRate

        // Apply minimum payment or remaining balance if less
        const paymentAmount = Math.min(debt.minimumPayment, debt.remainingBalance + interestThisMonth)
        remainingBudget -= paymentAmount

        // Calculate how much goes to principal vs interest
        const principalPayment = Math.max(0, paymentAmount - interestThisMonth)
        const interestPayment = paymentAmount - principalPayment

        // Update debt
        debt.remainingBalance = Math.max(0, debt.remainingBalance - principalPayment)
        debt.isPaidOff = debt.remainingBalance === 0

        totalPaid += paymentAmount
        totalInterestPaid += interestPayment

        monthlyPayments.push({
          debtId: debt.id,
          amount: paymentAmount,
          remainingBalance: debt.remainingBalance,
          isPaidOff: debt.isPaidOff,
        })
      })

      // Apply extra payments based on strategy
      if (remainingBudget > 0) {
        // Get non-paid-off debts
        const activeDebts = workingDebts.filter((debt) => !debt.isPaidOff)

        if (activeDebts.length > 0) {
          // Sort based on strategy
          let targetDebt

          switch (strategy) {
            case "avalanche":
              targetDebt = activeDebts.sort((a, b) => b.interestRate - a.interestRate)[0]
              break
            case "snowball":
              targetDebt = activeDebts.sort((a, b) => a.remainingBalance - b.remainingBalance)[0]
              break
            case "highestPaymentFirst":
              targetDebt = activeDebts.sort((a, b) => b.minimumPayment - a.minimumPayment)[0]
              break
            case "lowestPaymentFirst":
              targetDebt = activeDebts.sort((a, b) => a.minimumPayment - b.minimumPayment)[0]
              break
          }

          if (targetDebt) {
            // Apply extra payment
            const extraPayment = Math.min(remainingBudget, targetDebt.remainingBalance)
            targetDebt.remainingBalance -= extraPayment
            targetDebt.isPaidOff = targetDebt.remainingBalance === 0

            // Update payment record
            const paymentRecord = monthlyPayments.find((p) => p.debtId === targetDebt.id)
            if (paymentRecord) {
              paymentRecord.amount += extraPayment
              paymentRecord.remainingBalance = targetDebt.remainingBalance
              paymentRecord.isPaidOff = targetDebt.isPaidOff
            }

            totalPaid += extraPayment
          }
        }
      }

      // Calculate total remaining balance
      const totalRemaining = workingDebts.reduce((sum, debt) => sum + debt.remainingBalance, 0)

      // Add this month to the schedule
      schedule.push({
        month,
        payments: monthlyPayments,
        totalRemaining,
        totalPaid,
        totalInterestPaid,
      })

      month++
    }

    setPaymentSchedule(schedule)
    setTotalMonths(schedule.length)
    setTotalInterestPaid(totalInterestPaid)
    setTotalPaid(totalPaid)
  }

  // Get the original total balance
  const originalTotalBalance = debts.reduce((sum, debt) => sum + debt.balance, 0)

  // Calculate years and months
  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12

  // Format time string
  const timeString =
    years > 0
      ? `${years} year${years !== 1 ? "s" : ""}${months > 0 ? ` ${months} month${months !== 1 ? "s" : ""}` : ""}`
      : `${months} month${months !== 1 ? "s" : ""}`

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Calendar className="h-8 w-8 mb-2 text-primary" />
              <h3 className="text-lg font-medium">Time to Debt-Free</h3>
              <p className="text-2xl font-bold mt-2">{timeString}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <TrendingDown className="h-8 w-8 mb-2 text-primary" />
              <h3 className="text-lg font-medium">Interest Saved</h3>
              <p className="text-2xl font-bold mt-2">
                $
                {(originalTotalBalance * 0.15 - totalInterestPaid).toLocaleString("en-US", {
                  maximumFractionDigits: 0,
                })}
              </p>
              <p className="text-xs text-muted-foreground">Compared to minimum payments</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <BarChart3 className="h-8 w-8 mb-2 text-primary" />
              <h3 className="text-lg font-medium">Total Cost</h3>
              <p className="text-2xl font-bold mt-2">
                ${totalPaid.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-muted-foreground">
                Principal: ${originalTotalBalance.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="timeline">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timeline">Payment Timeline</TabsTrigger>
          <TabsTrigger value="details">Payment Details</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="pt-4">
          <div className="space-y-6">
            {paymentSchedule.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Start</span>
                  <span>Debt-Free!</span>
                </div>
                <Progress value={((totalMonths - paymentSchedule.length) / totalMonths) * 100} className="h-2" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Month 1</span>
                  <span>Month {totalMonths}</span>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {debts.map((debt, index) => {
                // Find when this debt will be paid off
                const paidOffMonth =
                  paymentSchedule.findIndex((month) => month.payments.find((p) => p.debtId === debt.id)?.isPaidOff) + 1

                const paidOffPercentage = (paidOffMonth / totalMonths) * 100

                return (
                  <div key={debt.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: `hsl(${index * 40}, 70%, 50%)` }}
                        />
                        <span>{debt.name}</span>
                      </div>
                      <span className="text-sm">
                        Paid off in {paidOffMonth} month{paidOffMonth !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <Progress value={paidOffPercentage} className="h-2" />
                  </div>
                )
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="details" className="pt-4">
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Debt</th>
                    <th className="text-right py-2">Starting Balance</th>
                    <th className="text-right py-2">Interest Rate</th>
                    <th className="text-right py-2">Payoff Date</th>
                    <th className="text-right py-2">Total Interest</th>
                  </tr>
                </thead>
                <tbody>
                  {debts.map((debt) => {
                    // Find when this debt will be paid off
                    const paidOffMonthIndex = paymentSchedule.findIndex(
                      (month) => month.payments.find((p) => p.debtId === debt.id)?.isPaidOff,
                    )

                    const paidOffMonth = paidOffMonthIndex + 1
                    const paidOffDate = new Date()
                    paidOffDate.setMonth(paidOffDate.getMonth() + paidOffMonth)

                    // Calculate total interest paid for this debt
                    let totalInterest = 0
                    for (let i = 0; i <= paidOffMonthIndex && i < paymentSchedule.length; i++) {
                      const payment = paymentSchedule[i].payments.find((p) => p.debtId === debt.id)
                      if (payment) {
                        const principal = Math.min(payment.amount, debt.remainingBalance)
                        const interest = payment.amount - principal
                        totalInterest += interest
                      }
                    }

                    return (
                      <tr key={debt.id} className="border-b">
                        <td className="py-2">{debt.name}</td>
                        <td className="text-right py-2">
                          $
                          {debt.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="text-right py-2">{debt.interestRate}%</td>
                        <td className="text-right py-2">{paidOffDate.toLocaleDateString()}</td>
                        <td className="text-right py-2">
                          $
                          {totalInterest.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Payment Strategy Tips</h3>
              <p className="text-sm text-muted-foreground">
                {strategy === "avalanche" &&
                  "The Avalanche method focuses on paying off high-interest debts first, which minimizes the total interest paid over time."}
                {strategy === "snowball" &&
                  "The Snowball method focuses on paying off smaller debts first, which can provide psychological wins and motivation to continue."}
                {strategy === "highestPaymentFirst" &&
                  "Paying off debts with the highest minimum payments first can free up cash flow more quickly."}
                {strategy === "lowestPaymentFirst" &&
                  "Paying off debts with the lowest minimum payments first can reduce the number of monthly obligations more quickly."}
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default PaymentPlan

