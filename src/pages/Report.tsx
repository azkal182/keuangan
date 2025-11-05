import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { TrendingUp, TrendingDown, BarChart3, Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Bar, BarChart, Line, LineChart, XAxis, YAxis } from "recharts";

interface Transaction {
  id: string;
  type: string;
  category: string;
  amount: number;
  description: string | null;
  transaction_date: string;
  user_id: string;
  created_at: string | null;
}

const Report = () => {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("transaction_date", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Gagal memuat transaksi",
        variant: "destructive",
      });
    } else {
      setTransactions(data || []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Filter transaksi per tahun
  const yearTransactions = transactions.filter((t) => {
    const date = new Date(t.transaction_date);
    return date.getFullYear() === selectedYear;
  });

  // Generate data per bulan untuk chart
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];

  const monthlyData = monthNames.map((month, index) => {
    const monthTransactions = yearTransactions.filter((t) => {
      const date = new Date(t.transaction_date);
      return date.getMonth() === index;
    });

    const income = monthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expense = monthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      month,
      pemasukan: income,
      pengeluaran: expense,
      saldo: income - expense,
    };
  });

  // Total tahunan
  const totalYearIncome = yearTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalYearExpense = yearTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalYearBalance = totalYearIncome - totalYearExpense;

  // Data kategori pengeluaran
  const expenseByCategory = yearTransactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => {
      const category = t.category;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += Number(t.amount);
      return acc;
    }, {} as Record<string, number>);

  const categoryData = Object.entries(expenseByCategory)
    .map(([category, amount]) => ({
      name: category,
      value: amount,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Top 10 kategori

  // Warna untuk chart
  const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  // Generate tahun options
  const years = [];
  if (transactions.length > 0) {
    const firstYear = new Date(transactions[0].transaction_date).getFullYear();
    const currentYear = new Date().getFullYear();
    for (let year = firstYear; year <= currentYear; year++) {
      years.push(year);
    }
  } else {
    years.push(new Date().getFullYear());
  }

  // Chart config
  const chartConfig = {
    pemasukan: {
      label: "Pemasukan",
      color: "hsl(var(--chart-1))",
    },
    pengeluaran: {
      label: "Pengeluaran",
      color: "hsl(var(--chart-2))",
    },
    saldo: {
      label: "Saldo",
      color: "hsl(var(--chart-3))",
    },
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-secondary via-background to-muted">
      <Navbar />
      <div className="container mx-auto p-4 md:p-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Report Keuangan
            </h1>
            <p className="text-muted-foreground">
              Analisis dan perbandingan data keuangan
            </p>
          </div>
          <div className="flex items-center justify-end md:justify-start gap-2 w-full md:w-auto shrink-0">
            <Calendar className="w-4 h-4 text-muted-foreground hidden md:block" />
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
              <SelectTrigger className="w-[120px] sm:w-[140px] h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Memuat data...</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Pemasukan
                  </CardTitle>
                  <TrendingUp className="w-5 h-5 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl md:text-3xl font-bold text-foreground">
                    Rp {totalYearIncome.toLocaleString("id-ID")}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tahun {selectedYear}
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Pengeluaran
                  </CardTitle>
                  <TrendingDown className="w-5 h-5 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl md:text-3xl font-bold text-foreground">
                    Rp {totalYearExpense.toLocaleString("id-ID")}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tahun {selectedYear}
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Saldo Tahun
                  </CardTitle>
                  <BarChart3 className="w-5 h-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-2xl md:text-3xl font-bold ${
                      totalYearBalance >= 0
                        ? "text-success"
                        : "text-destructive"
                    }`}
                  >
                    Rp {totalYearBalance.toLocaleString("id-ID")}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tahun {selectedYear}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Trend Chart */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Trend Pemasukan & Pengeluaran</CardTitle>
                  <CardDescription>
                    Perbandingan bulanan tahun {selectedYear}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig}>
                    <BarChart data={monthlyData}>
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) =>
                          `Rp${(value / 1000).toFixed(0)}k`
                        }
                      />
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload?.length) {
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="grid gap-2">
                                  {payload.map((item, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between gap-4"
                                    >
                                      <div className="flex items-center gap-2">
                                        <div
                                          className="h-2.5 w-2.5 rounded-full"
                                          style={{
                                            backgroundColor: item.color,
                                          }}
                                        />
                                        <span className="text-sm text-muted-foreground">
                                          {item.name === "pemasukan"
                                            ? "Pemasukan"
                                            : item.name === "pengeluaran"
                                            ? "Pengeluaran"
                                            : "Saldo"}
                                        </span>
                                      </div>
                                      <span className="font-medium">
                                        Rp{" "}
                                        {Number(item.value).toLocaleString(
                                          "id-ID"
                                        )}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="pemasukan"
                        fill="var(--color-pemasukan)"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="pengeluaran"
                        fill="var(--color-pengeluaran)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Saldo Trend */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Trend Saldo Bulanan</CardTitle>
                  <CardDescription>
                    Saldo per bulan tahun {selectedYear}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig}>
                    <LineChart data={monthlyData}>
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) =>
                          `Rp${(value / 1000).toFixed(0)}k`
                        }
                      />
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload?.length) {
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="grid gap-2">
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-sm text-muted-foreground">
                                      Saldo
                                    </span>
                                    <span
                                      className={`font-medium ${
                                        Number(payload[0].value) >= 0
                                          ? "text-success"
                                          : "text-destructive"
                                      }`}
                                    >
                                      Rp{" "}
                                      {Number(payload[0].value).toLocaleString(
                                        "id-ID"
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="saldo"
                        stroke="var(--color-saldo)"
                        strokeWidth={2}
                        dot={{ fill: "var(--color-saldo)", r: 4 }}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Category Chart */}
            {categoryData.length > 0 && (
              <Card className="shadow-lg mb-8">
                <CardHeader>
                  <CardTitle>Kategori Pengeluaran Terbanyak</CardTitle>
                  <CardDescription>
                    Top 10 kategori pengeluaran tahun {selectedYear}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartContainer config={chartConfig}>
                      <BarChart data={categoryData} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="name"
                          type="category"
                          tickLine={false}
                          axisLine={false}
                          width={100}
                        />
                        <ChartTooltip
                          content={({ active, payload }) => {
                            if (active && payload?.length) {
                              return (
                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-sm text-muted-foreground">
                                      {payload[0].payload.name}
                                    </span>
                                    <span className="font-medium">
                                      Rp{" "}
                                      {Number(payload[0].value).toLocaleString(
                                        "id-ID"
                                      )}
                                    </span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar
                          dataKey="value"
                          fill="var(--color-pengeluaran)"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ChartContainer>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm mb-4">
                        Detail Kategori
                      </h4>
                      {categoryData.map((item, index) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor: COLORS[index % COLORS.length],
                              }}
                            />
                            <span className="text-sm font-medium">
                              {item.name}
                            </span>
                          </div>
                          <span className="text-sm font-semibold">
                            Rp {item.value.toLocaleString("id-ID")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Monthly Comparison Table */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Perbandingan Bulanan</CardTitle>
                <CardDescription>
                  Detail pemasukan, pengeluaran, dan saldo per bulan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left font-semibold text-xs sm:text-sm text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                        Bulan
                      </TableHead>
                      <TableHead className="text-right font-semibold text-xs sm:text-sm text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                        Pemasukan
                      </TableHead>
                      <TableHead className="text-right font-semibold text-xs sm:text-sm text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                        Pengeluaran
                      </TableHead>
                      <TableHead className="text-right font-semibold text-xs sm:text-sm text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                        Saldo
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyData.map((data, index) => (
                      <TableRow
                        key={index}
                        className="hover:bg-secondary/30 transition-colors duration-150"
                      >
                        <TableCell className="font-medium text-sm sm:text-base text-foreground whitespace-nowrap">
                          {data.month}
                        </TableCell>
                        <TableCell className="text-right text-sm sm:text-base font-medium text-success whitespace-nowrap">
                          {data.pemasukan > 0 ? (
                            <>Rp {data.pemasukan.toLocaleString("id-ID")}</>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm sm:text-base font-medium text-destructive whitespace-nowrap">
                          {data.pengeluaran > 0 ? (
                            <>Rp {data.pengeluaran.toLocaleString("id-ID")}</>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell
                          className={`text-right text-sm sm:text-base font-semibold whitespace-nowrap ${
                            data.saldo >= 0
                              ? "text-success"
                              : "text-destructive"
                          }`}
                        >
                          Rp {data.saldo.toLocaleString("id-ID")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow className="bg-secondary/20 border-t-2">
                      <TableCell className="font-semibold text-sm sm:text-base text-foreground whitespace-nowrap">
                        Total
                      </TableCell>
                      <TableCell className="text-right text-sm sm:text-base font-semibold text-success whitespace-nowrap">
                        Rp {totalYearIncome.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right text-sm sm:text-base font-semibold text-destructive whitespace-nowrap">
                        Rp {totalYearExpense.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell
                        className={`text-right text-sm sm:text-base font-bold whitespace-nowrap ${
                          totalYearBalance >= 0
                            ? "text-success"
                            : "text-destructive"
                        }`}
                      >
                        Rp {totalYearBalance.toLocaleString("id-ID")}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Report;
