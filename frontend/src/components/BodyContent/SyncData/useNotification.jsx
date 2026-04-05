import { useEffect } from "react"
import { notification } from "antd"

const useNotification = (status, successMessage, errorMessage) => {
  useEffect(() => {
    if (status === "succeeded") {
      notification.success({
        message: "Success",
        description: successMessage,
      })
    } else if (status === "failed") {
      notification.error({
        message: "Error",
        description: errorMessage,
      })
    }
  }, [status, successMessage, errorMessage])
}

export default useNotification
