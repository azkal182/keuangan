import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface SpendingCategory {
  id: string;
  category: string;
  percentage: number;
  spent: number;
  allocated: number;
  remaining: number;
  percentageUsed: number;
  isOverBudget: boolean;
}

interface AllocationProgressProps {
  spendingByCategory: SpendingCategory[];
}

export const AllocationProgress = ({
  spendingByCategory,
}: AllocationProgressProps) => {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Progress Alokasi</CardTitle>
        <CardDescription>Penggunaan budget per kategori</CardDescription>
      </CardHeader>
      <CardContent>
        {spendingByCategory.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Belum ada alokasi yang diatur
          </p>
        ) : (
          <div className="space-y-6">
            {spendingByCategory.map((category) => (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-foreground">
                      {category.category}
                    </h4>
                    {category.isOverBudget ? (
                      <AlertTriangle className="w-4 h-4 text-warning" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {category.percentage}% dari penghasilan
                  </span>
                </div>

                <Progress
                  value={Math.min(category.percentageUsed, 100)}
                  className="h-2"
                />

                <div className="flex justify-between text-sm">
                  <span
                    className={
                      category.isOverBudget
                        ? "text-destructive font-medium"
                        : "text-muted-foreground"
                    }
                  >
                    Terpakai: Rp {category.spent.toLocaleString("id-ID")}
                  </span>
                  <span className="text-muted-foreground">
                    Alokasi: Rp {category.allocated.toLocaleString("id-ID")}
                  </span>
                </div>

                {category.isOverBudget ? (
                  <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                    ⚠️ Melebihi budget sebesar Rp{" "}
                    {Math.abs(category.remaining).toLocaleString("id-ID")}
                  </p>
                ) : (
                  <p className="text-xs text-success bg-success/10 p-2 rounded">
                    ✓ Sisa budget: Rp{" "}
                    {category.remaining.toLocaleString("id-ID")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
