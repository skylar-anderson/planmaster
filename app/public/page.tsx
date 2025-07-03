export default function PublicPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Public Page</h1>
      <p className="text-gray-600">This page is publicly accessible without authentication.</p>
      <div className="mt-4">
        <a href="/dashboard" className="text-blue-600 hover:underline">Try accessing protected dashboard →</a>
      </div>
    </div>
  )
}