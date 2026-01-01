export const Title = ({ text, className }) => {
  return (
    <div className={`h-16 text-[40px] font-extrabold flex items-center justify-center z-100 ${className}`}>
      {text}
    </div>
  )
}