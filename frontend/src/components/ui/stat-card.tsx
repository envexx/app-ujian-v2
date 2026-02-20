import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@phosphor-icons/react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: Icon;
  iconColor?: string;
  iconBg?: string;
}

export function StatCard({ title, value, icon: IconComponent, iconColor = "text-gray-600", iconBg = "bg-gray-100" }: StatCardProps) {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-semibold tracking-tight">{value}</p>
          </div>
          <div className={`p-2.5 rounded-xl ${iconBg} flex-shrink-0`}>
            <IconComponent className={`w-6 h-6 ${iconColor}`} weight="duotone" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
