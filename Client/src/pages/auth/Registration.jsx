import { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { StoreContext } from '../../context/store'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function Registration(){
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const { setToken } = useContext(StoreContext)
    const navigate = useNavigate()

    const handleRegistration = (e) => {
        e.preventDefault()
        // Simulate registration - replace with actual API call
        if (name && email && password) {
            setToken('dummy-token-123')
            navigate('/dashboard')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Create Account</CardTitle>
                    <CardDescription>
                        Sign up for a new account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleRegistration} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Enter your full name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Create a password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full">
                            Create Account
                        </Button>
                        <div className="text-center">
                            <Link to="/login" className="text-sm text-blue-600 hover:underline">
                                Already have an account? Login here
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}