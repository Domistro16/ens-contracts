export default function LogInButton() {
    console.log(localStorage)
    const returnUrl = encodeURIComponent(window.location.href) 
  return (
    <button
      className="bg-blue-800 p-8 py-[8px] font-bold rounded-full hover:scale-105 duration-200 cursor-pointer"
      type="button"
    >
      <a href={`http://localhost:5174/login?redirect_to=${returnUrl}`}>Login</a>
    </button>
  )
}
