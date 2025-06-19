export default function LogInButton() {
    console.log(localStorage)
    const returnUrl = encodeURIComponent(window.location.href) 
  return (
    <button
      className="bg-blue-800 p-8 py-[8px] font-bold rounded-full hover:scale-105 duration-200 cursor-pointer"
      type="button"
    >
      <a href={`https://level3auth.vercel.app/login?redirect_to=${returnUrl}`}>
        Login
      </a>
    </button>
  )
}
