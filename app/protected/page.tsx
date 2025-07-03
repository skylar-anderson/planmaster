export default function ProtectedPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Protected Route</h1>
      <p className="text-gray-600">This is another protected route that requires authentication.</p>
      <p className="text-green-600 mt-4">✓ Authentication middleware is working correctly!</p>
    </div>
  )
}