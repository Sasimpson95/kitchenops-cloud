export default function Greeting() {
  const hour = new Date().getHours();

  let greeting = "Good Evening";

  if (hour < 12) {
    greeting = "Good Morning";
  } else if (hour < 18) {
    greeting = "Good Afternoon";
  }

  return (
    <div>
      <h1 className="text-5xl font-bold text-gray-900">{greeting}</h1>

      <p className="mt-3 text-lg text-gray-500">
        Here's what's happening across your kitchen today.
      </p>
    </div>
  );
}