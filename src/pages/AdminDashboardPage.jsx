import React, { useEffect, useState } from "react";
import MkdSDK from "../utils/MkdSDK";
import { AuthContext } from "../authContext";
import { useNavigate } from "react-router-dom";
import { GlobalContext, showToast } from "../globalContext";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import SnackBar from "../components/SnackBar";

const ItemType = "ITEM";

const DraggableItem = ({ id, index, moveItem, children }) => {
  const ref = React.useRef(null);

  const [, drop] = useDrop({
    accept: ItemType,
    hover(item, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      item.index = hoverIndex;
      moveItem(dragIndex, hoverIndex);
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div ref={ref} style={{ opacity: isDragging ? 0.5 : 1 }}>
      {children}
    </div>
  );
};

const AdminDashboardPage = () => {
  const [paginatedData, setPaginatedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { dispatch } = React.useContext(AuthContext);
  const { dispatch: globalDispatch } = React.useContext(GlobalContext);
  const navigate = useNavigate();

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const fetchPaginatedData = async () => {
    try {
      const payload = {
        payload: {},
        page: currentPage,
        limit: 10,
      };

      const method = "PAGINATE";
      let sdk = new MkdSDK();

      const result = await sdk.callRestAPI(payload, method);
      setPaginatedData(result);
    } catch (error) {
      console.error("Error fetching paginated data:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    setCurrentPage((prevPage) => prevPage + 1);
  };

  const handlePrevPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const handleLogout = () => {
    dispatch({
      type: "LOGOUT",
    });
    showToast(globalDispatch, "Logout Successful");
    navigate("/admin/login");
  };

  const moveItem = (dragIndex, hoverIndex) => {
    const draggedItem = paginatedData.list[dragIndex];
    const updatedList = [...paginatedData.list];
    updatedList.splice(dragIndex, 1);
    updatedList.splice(hoverIndex, 0, draggedItem);

    setPaginatedData((prevData) => ({
      ...prevData,
      list: updatedList,
    }));
  };

  useEffect(() => {
    fetchPaginatedData();
  }, [currentPage]);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <>
      <div className="px-28 bg-[#111111]">
        <div className="flex justify-between pt-6">
          <h1 className="text-[#ffffff] text-5xl font-black">APP</h1>
          <button
            className="bg-[#9BFF00] rounded-full px-[24px] py-[12px] flex gap-x-2"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
        <div className="flex justify-between mt-10 items-center">
          <h4 className="text-[#ffffff] text-4xl">Todays leaderboard</h4>
          <div className="flex gap-x-4 bg-[#1D1D1D] px-[24px] py-[16px] items-center rounded-3xl">
            <p className="text-[#FFFFFF] text-base">{formattedDate}</p>
            <p className="px-[10px] py-[4px] rounded-3xl text-base bg-[#9BFF00]">
              SUBMISSIONS OPEN
            </p>
            <p className="text-[#FFFFFF] text-base">11 : 30</p>
          </div>
        </div>
        <DndProvider backend={HTML5Backend}>
          <div className="w-[100%]">
            <div className="text-[#666666] grid grid-flow-col auto-cols-max w-full mt-10 px-6 py-2 place-content-between">
              <span>#</span>
              <span className="w-[360px]">Title</span>
              <span>Author</span>
              <span className="flex items-center gap-x-2 cursor-pointer">
                Most Liked{" "}
              </span>
            </div>
            {paginatedData && paginatedData.list.length !== 0 ? (
              paginatedData.list.map((item, index) => (
                <DraggableItem key={item.id} id={item.id} index={index} moveItem={moveItem}>
                  <div
                    className="grid grid-flow-col auto-cols-max content-center items-center text-[#ffffff] border border-[#666666] rounded-lg mt-5 py-4 px-6 justify-between w-full"
                  >
                    <span>{item.id}</span>
                    <div className="flex gap-6 items-center">
                      <img
                        src={item?.photo}
                        alt="movieImg"
                        className="h-[64px] w-[118px]"
                      />
                      <p className="text-xl w-[364px]"> {item.title}</p>
                    </div>
                    <p className="text-[#DBFD51]">{item.username}</p>
                    <p className="flex items-center gap-x-2">{item.like}</p>
                  </div>
                </DraggableItem>
              ))
            ) : (
              <p>No data found</p>
            )}
            <div className="flex gap-2 mt-5 pb-10">
              <button
                onClick={handlePrevPage}
                className="bg-[#9BFF00] rounded-full px-[24px] py-[12px]"
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <button
                onClick={handleNextPage}
                className="bg-[#9BFF00] rounded-full px-[24px] py-[12px]"
              >
                Next
              </button>
            </div>
          </div>
        </DndProvider>
      </div>
      <SnackBar />
    </>
  );
};

export default AdminDashboardPage;
