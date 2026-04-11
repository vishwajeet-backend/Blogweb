import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  ExternalLink,
  Zap,
  Users,
  Gift,
  Settings
} from "lucide-react"

export default function MonetizationPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Monetization</h1>
        <p className="text-neutral-600 mt-1">Turn your content into revenue</p>
      </div>

      {/* Earnings Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-neutral-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹1,94,635</div>
            <p className="text-xs text-neutral-600 mt-1">
              <span className="text-green-600">+12.5%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-neutral-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹40,421</div>
            <p className="text-xs text-neutral-600 mt-1">
              15 days remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
            <Users className="h-4 w-4 text-neutral-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-xs text-neutral-600 mt-1">
              <span className="text-green-600">+8</span> this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Zap className="h-4 w-4 text-neutral-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2%</div>
            <p className="text-xs text-neutral-600 mt-1">
              Average across platforms
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monetization Methods */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Subscriptions</CardTitle>
                <CardDescription>Monthly recurring revenue from subscribers</CardDescription>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                <div>
                  <p className="font-medium">Monthly Subscription</p>
                  <p className="text-sm text-neutral-600">₹829/month</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">124 subscribers</p>
                  <p className="text-sm text-neutral-600">₹1,02,754/mo</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                <div>
                  <p className="font-medium">Annual Subscription</p>
                  <p className="text-sm text-neutral-600">₹8,217/year</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">18 subscribers</p>
                  <p className="text-sm text-neutral-600">₹12,367/mo avg</p>
                </div>
              </div>
              <Button variant="outline" className="w-full gap-2">
                <Settings className="h-4 w-4" />
                Manage Pricing
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Sponsorships</CardTitle>
                <CardDescription>Partner with brands for sponsored content</CardDescription>
              </div>
              <Badge variant="secondary">Available</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border border-dashed border-neutral-200 rounded-lg text-center">
                <Gift className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                <p className="font-medium mb-1">No active sponsorships</p>
                <p className="text-sm text-neutral-600 mb-4">
                  Connect with brands that align with your content
                </p>
                <Button>Find Sponsors</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Affiliate Marketing</CardTitle>
                <CardDescription>Earn commissions from product recommendations</CardDescription>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                <div>
                  <p className="font-medium">Total Clicks</p>
                  <p className="text-sm text-neutral-600">This month</p>
                </div>
                <p className="text-2xl font-bold">1,234</p>
              </div>
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                <div>
                  <p className="font-medium">Conversions</p>
                  <p className="text-sm text-neutral-600">This month</p>
                </div>
                <p className="text-2xl font-bold">42</p>
              </div>
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                <div>
                  <p className="font-medium">Commission Earned</p>
                  <p className="text-sm text-neutral-600">This month</p>
                </div>
                <p className="text-2xl font-bold">₹19,422</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Ad Revenue</CardTitle>
                <CardDescription>Display ads on your content</CardDescription>
              </div>
              <Badge variant="secondary">Not Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-neutral-600">
                Monetize your blog with Google AdSense or other ad networks
              </p>
              <div className="p-4 bg-neutral-50 rounded-lg">
                <p className="text-sm mb-2"><strong>Requirements:</strong></p>
                <ul className="text-sm text-neutral-600 space-y-1">
                  <li>• Minimum 10,000 monthly views</li>
                  <li>• Original content</li>
                  <li>• Active for at least 3 months</li>
                </ul>
              </div>
              <Button variant="outline" className="w-full">
                Enable Ad Revenue
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payout Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            <CardTitle>Payout Settings</CardTitle>
          </div>
          <CardDescription>Manage how you receive your earnings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
              <div>
                <p className="font-medium">Available Balance</p>
                <p className="text-sm text-neutral-600">Ready to withdraw</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">₹40,421.00</p>
                <Button size="sm" className="mt-2">Request Payout</Button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 border border-neutral-200 rounded-lg">
                <p className="font-medium mb-2">Payout Method</p>
                <p className="text-sm text-neutral-600">Bank Transfer (ACH)</p>
                <Button variant="outline" size="sm" className="mt-3 gap-2">
                  Change Method
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
              <div className="p-4 border border-neutral-200 rounded-lg">
                <p className="font-medium mb-2">Payout Schedule</p>
                <p className="text-sm text-neutral-600">Monthly on the 1st</p>
                <Button variant="outline" size="sm" className="mt-3">
                  Change Schedule
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
