import "./CustomProgress.css";
import { Path, PathStep } from "react-rainbow-components";

const CustomProgress = (props) => {

  return (
    <div className="progress__container">
      <div className="rainbow-p-around_x-large rainbow-align-content_center">
        <Path currentStepName={props.current}>
          {props.options.map((v, i) => {
            return <PathStep name={v} label={v} />;
          })}
        </Path>
      </div>
    </div>
  );
};

export default CustomProgress;
