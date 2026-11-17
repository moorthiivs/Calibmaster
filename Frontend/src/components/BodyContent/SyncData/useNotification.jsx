import { useEffect } from "react"
import GlobalNotification from "../../../utils/GlobalNotification"

const useNotification = (status, successMessage, errorMessage) => {
  useEffect(() => {
    if (status === "succeeded") {
      GlobalNotification.success({
        title: "Success",
        description: successMessage,
      })
    } else if (status === "failed") {
      GlobalNotification.error({
        title: "Error",
        description: errorMessage,
      })
    }
  }, [status, successMessage, errorMessage])
}

export default useNotification

