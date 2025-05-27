import React from "react";

type Props = {
  buttonComponent?: any;
  isSmallText?: boolean;
};

const Header = ({ buttonComponent }: Props) => {
  return (
    <div className="mb-5 flex w-full items-center justify-end">
      {buttonComponent}
    </div>
  );
};

export default Header;
