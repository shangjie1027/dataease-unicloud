package io.dataease.commons.constants;

import java.util.ArrayList;
import java.util.List;

public class SelfDsType {
    public static List<String> dsTypes = new ArrayList<>();
    static {
        dsTypes.add("mysql");
        dsTypes.add("hive");
        dsTypes.add("pg");
        dsTypes.add("es");
        dsTypes.add("StarRocks");
        dsTypes.add("ds_doris");
        dsTypes.add("api");
    }

    public static boolean needDsType(String type){
        if (dsTypes.contains(type)) return true;

        return false;
    }

}
