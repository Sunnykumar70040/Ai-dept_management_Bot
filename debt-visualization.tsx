"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Debt } from "./debt-management-coach"

interface DebtVisualizationProps {
  debts: Debt[]
}

const DebtVisualization = ({ debts }: DebtVisualizationProps) => {
  const balanceCanvasRef = useRef<HTMLCanvasElement>(null)
  const interestCanvasRef = useRef<HTMLCanvasElement>(null)

  const totalBalance = debts.reduce((sum, debt) => sum + debt.balance, 0)
  const totalInterest = debts.reduce((sum, debt) => sum + (debt.balance * debt.interestRate) / 100, 0)

  // Colors for the charts
  const colors = [
    "#3b82f6", // blue
    "#ef4444", // red
    "#10b981", // green
    "#f59e0b", // amber
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#6366f1", // indigo
    "#14b8a6", // teal
  ]

  const drawPieChart = (canvas: HTMLCanvasElement | null, data: { label: string; value: number; color: string }[]) => {
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const total = data.reduce((sum, item) => sum + item.value, 0)
    let startAngle = 0

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw pie segments
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 10

    data.forEach((item) => {
      const sliceAngle = (2 * Math.PI * item.value) / total

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle)
      ctx.closePath()

      ctx.fillStyle = item.color
      ctx.fill()

      startAngle += sliceAngle
    })

    // Draw center circle (donut hole)
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius * 0.5, 0, 2 * Math.PI)
    ctx.fillStyle = "white"
    ctx.fill()
  }

  useEffect(() => {
    // Prepare data for balance chart
    const balanceData = debts.map((debt, index) => ({
      label: debt.name,
      value: debt.balance,
      color: colors[index % colors.length],
    }))

    // Prepare data for interest chart
    const interestData = debts.map((debt, index) => ({
      label: debt.name,
      value: (debt.balance * debt.interestRate) / 100,
      color: colors[index % colors.length],
    }))

    // Draw charts
    drawPieChart(balanceCanvasRef.current, balanceData)
    drawPieChart(interestCanvasRef.current, interestData)
  }, [debts])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Debt Overview</CardTitle>
        <CardDescription>Visualize your debt breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="balance">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="balance">Balance</TabsTrigger>
            <TabsTrigger value="interest">Interest</TabsTrigger>
          </TabsList>
          <TabsContent value="balance" className="pt-4">
            <div className="flex flex-col items-center">
              <canvas ref={balanceCanvasRef} width={250} height={250} />
              <div className="mt-4 text-center">
                <p className="text-lg font-semibold">Total Balance</p>
                <p className="text-3xl font-bold">
                  ${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-full mt-4 grid gap-2">
                {debts.map((debt, index) => (
                  <div key={debt.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: colors[index % colors.length] }}
                      />
                      <span>{debt.name}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium">
                        ${debt.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-muted-foreground text-sm ml-2">
                        ({((debt.balance / totalBalance) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="interest" className="pt-4">
            <div className="flex flex-col items-center">
              <canvas ref={interestCanvasRef} width={250} height={250} />
              <div className="mt-4 text-center">
                <p className="text-lg font-semibold">Annual Interest</p>
                <p className="text-3xl font-bold">
                  ${totalInterest.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-full mt-4 grid gap-2">
                {debts.map((debt, index) => {
                  const annualInterest = (debt.balance * debt.interestRate) / 100
                  return (
                    <div key={debt.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: colors[index % colors.length] }}
                        />
                        <span>{debt.name}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium">
                          $
                          {annualInterest.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <span className="text-muted-foreground text-sm ml-2">({debt.interestRate}%)</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default DebtVisualization

