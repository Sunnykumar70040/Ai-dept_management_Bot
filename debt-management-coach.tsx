"use client"

import { useState } from "react"
import { PlusCircle, Trash2, ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import DebtVisualization from "./debt-visualization"
import PaymentPlan from "./payment-plan"

export interface Debt {
  id: string
  name: string
  balance: number
  interestRate: number
  minimumPayment: number
}

export interface PaymentStrategy {
  name: string
  description: string
  value: "avalanche" | "snowball" | "highestPaymentFirst" | "lowestPaymentFirst"
}

const DebtManagementCoach = () => {
  const [debts, setDebts] = useState<Debt[]>([
    { id: "1", name: "Credit Card", balance: 5000, interestRate: 18.99, minimumPayment: 150 },
    { id: "2", name: "Student Loan", balance: 15000, interestRate: 4.5, minimumPayment: 200 },
  ])
  const [monthlyBudget, setMonthlyBudget] = useState<number>(600)
  const [activeTab, setActiveTab] = useState<string>("input")
  const [selectedStrategy, setSelectedStrategy] = useState<string>("avalanche")

  const strategies: PaymentStrategy[] = [
    {
      name: "Avalanche Method",
      description: "Pay off debts with highest interest rates first",
      value: "avalanche",
    },
    {
      name: "Snowball Method",
      description: "Pay off smallest debts first for quick wins",
      value: "snowball",
    },
    {
      name: "Highest Payment First",
      description: "Pay off debts with highest minimum payments first",
      value: "highestPaymentFirst",
    },
    {
      name: "Lowest Payment First",
      description: "Pay off debts with lowest minimum payments first",
      value: "lowestPaymentFirst",
    },
  ]

  const addDebt = () => {
    const newDebt: Debt = {
      id: Date.now().toString(),
      name: "New Debt",
      balance: 0,
      interestRate: 0,
      minimumPayment: 0,
    }
    setDebts([...debts, newDebt])
  }

  const updateDebt = (id: string, field: keyof Debt, value: string | number) => {
    setDebts(
      debts.map((debt) => {
        if (debt.id === id) {
          return {
            ...debt,
            [field]: typeof value === "string" && field !== "name" ? Number.parseFloat(value) || 0 : value,
          }
        }
        return debt
      }),
    )
  }

  const removeDebt = (id: string) => {
    setDebts(debts.filter((debt) => debt.id !== id))
  }

  const totalMinimumPayment = debts.reduce((sum, debt) => sum + debt.minimumPayment, 0)
  const isValidBudget = monthlyBudget >= totalMinimumPayment

  const calculatePaymentPlan = () => {
    // Sort debts based on selected strategy
    const sortedDebts = [...debts]

    switch (selectedStrategy) {
      case "avalanche":
        sortedDebts.sort((a, b) => b.interestRate - a.interestRate)
        break
      case "snowball":
        sortedDebts.sort((a, b) => a.balance - b.balance)
        break
      case "highestPaymentFirst":
        sortedDebts.sort((a, b) => b.minimumPayment - a.minimumPayment)
        break
      case "lowestPaymentFirst":
        sortedDebts.sort((a, b) => a.minimumPayment - b.minimumPayment)
        break
      default:
        break
    }

    return sortedDebts
  }

  const handleGeneratePlan = () => {
    setActiveTab("results")
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="input">Input Debts</TabsTrigger>
          <TabsTrigger value="strategy" disabled={debts.length === 0}>
            Choose Strategy
          </TabsTrigger>
          <TabsTrigger value="results" disabled={!isValidBudget || debts.length === 0}>
            Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="input">
          <Card>
            <CardHeader>
              <CardTitle>Enter Your Debts</CardTitle>
              <CardDescription>Add all your debts to get started with your repayment plan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {debts.map((debt) => (
                  <div key={debt.id} className="p-4 border rounded-lg space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">{debt.name}</h3>
                      <Button variant="ghost" size="icon" onClick={() => removeDebt(debt.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`name-${debt.id}`}>Debt Name</Label>
                        <Input
                          id={`name-${debt.id}`}
                          value={debt.name}
                          onChange={(e) => updateDebt(debt.id, "name", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`balance-${debt.id}`}>Current Balance ($)</Label>
                        <Input
                          id={`balance-${debt.id}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={debt.balance}
                          onChange={(e) => updateDebt(debt.id, "balance", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`interest-${debt.id}`}>Interest Rate (%)</Label>
                        <Input
                          id={`interest-${debt.id}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={debt.interestRate}
                          onChange={(e) => updateDebt(debt.id, "interestRate", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`payment-${debt.id}`}>Minimum Payment ($)</Label>
                        <Input
                          id={`payment-${debt.id}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={debt.minimumPayment}
                          onChange={(e) => updateDebt(debt.id, "minimumPayment", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <Button onClick={addDebt} variant="outline" className="w-full">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Another Debt
                </Button>

                <div className="space-y-2 pt-4">
                  <Label htmlFor="monthly-budget">Monthly Payment Budget ($)</Label>
                  <Input
                    id="monthly-budget"
                    type="number"
                    min={totalMinimumPayment}
                    step="10"
                    value={monthlyBudget}
                    onChange={(e) => setMonthlyBudget(Number.parseFloat(e.target.value) || 0)}
                  />
                  {!isValidBudget && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertDescription>
                        Your monthly budget must be at least ${totalMinimumPayment.toFixed(2)} to cover all minimum
                        payments.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => setActiveTab("strategy")} disabled={debts.length === 0}>
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="strategy">
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Repayment Strategy</CardTitle>
              <CardDescription>Different strategies work better for different situations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <DebtVisualization debts={debts} />

                <div className="pt-4">
                  <RadioGroup value={selectedStrategy} onValueChange={setSelectedStrategy}>
                    {strategies.map((strategy) => (
                      <div key={strategy.value} className="flex items-start space-x-2 p-4 border rounded-lg mb-3">
                        <RadioGroupItem value={strategy.value} id={strategy.value} />
                        <div className="grid gap-1.5">
                          <Label htmlFor={strategy.value} className="font-medium">
                            {strategy.name}
                          </Label>
                          <p className="text-sm text-muted-foreground">{strategy.description}</p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("input")}>
                Back
              </Button>
              <Button onClick={handleGeneratePlan}>
                Generate Plan <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Your Debt Repayment Plan</CardTitle>
              <CardDescription>
                Based on the {strategies.find((s) => s.value === selectedStrategy)?.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentPlan
                debts={calculatePaymentPlan()}
                monthlyBudget={monthlyBudget}
                strategy={selectedStrategy as PaymentStrategy["value"]}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveTab("strategy")}>
                Back
              </Button>
              <Button variant="outline" onClick={() => setActiveTab("input")}>
                Edit Debts
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default DebtManagementCoach

